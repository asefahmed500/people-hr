import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guards"
import { recordActivity } from "@/lib/activity"
import { notifyPayrollRecorded } from "@/lib/notify-server"
import { defaultPayrollStore, planPayrollRun, type PayrollStore } from "@/lib/data/payroll"
import { currentPeriod } from "@/lib/data/payslips"
import { defaultEmployees, type Employee } from "@/lib/data/employees"

// Recording a pay run is a business operation, not a raw document replace:
// snapshot salaries for a period, guard against concurrent edits, write an
// audit event, and tell approvers the rows are ready. No funds move here.

const WORKSPACE_ID = "__workspace__"
const bodySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
})

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid pay period." }, { status: 400 })
  }
  const period = parsed.data.period ?? currentPeriod()

  const [employeeDoc, payrollDoc] = await Promise.all([
    prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key: "employees" } },
    }),
    prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key: "payroll" } },
    }),
  ])
  const employees = (employeeDoc?.data ?? defaultEmployees) as Employee[]
  const payroll = (payrollDoc?.data ?? defaultPayrollStore) as PayrollStore
  const result = planPayrollRun(payroll.payments ?? [], employees, period)
  const next: PayrollStore = { payments: result.payments, lastRun: new Date().toISOString() }

  try {
    if (payrollDoc) {
      const swapped = await prisma.moduleState.updateMany({
        where: { id: payrollDoc.id, updatedAt: payrollDoc.updatedAt },
        data: { data: next as unknown as Prisma.InputJsonValue },
      })
      if (swapped.count !== 1) throw new Error("Payroll changed meanwhile; please retry the run.")
    } else {
      await prisma.moduleState.create({
        data: {
          userId: WORKSPACE_ID,
          key: "payroll",
          data: next as unknown as Prisma.InputJsonValue,
        },
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record the run." },
      { status: 409 },
    )
  }

  // A no-op re-run must not generate misleading "N payments ready" notices.
  if (result.processed === 0) {
    return NextResponse.json({
      ok: true,
      period,
      payments: next.payments,
      lastRun: next.lastRun,
      processed: 0,
      skipped: result.skipped.map((e) => e.name),
    })
  }

  await Promise.allSettled([
    recordActivity({
      actor: {
        id: auth.session.user.id,
        name: auth.session.user.name ?? null,
        department: auth.session.user.department ?? null,
        role: auth.session.user.role,
      },
      action: "created",
      module: "payroll",
      summary: `Recorded ${result.processed} payment(s) for ${period}; no funds transferred`,
    }),
    notifyPayrollRecorded({ period, count: result.processed, actorId: auth.session.user.id }),
  ])

  return NextResponse.json({
    ok: true,
    period,
    payments: next.payments,
    lastRun: next.lastRun,
    processed: result.processed,
    skipped: result.skipped.map((e) => e.name),
  })
}
