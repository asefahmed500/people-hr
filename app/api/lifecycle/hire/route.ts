import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guards"
import { recordActivity } from "@/lib/activity"
import { notifyNewHire } from "@/lib/notify-server"
import { newEmployee, defaultEmployees, type Employee } from "@/lib/data/employees"
import { defaultBalances, defaultLeaveStore, type LeaveStore } from "@/lib/data/leave"
import { defaultRecruitmentStore, type RecruitmentStore } from "@/lib/data/recruitment"
import { buildOnboardingChecklist, defaultOnboardingStore, type OnboardingStore } from "@/lib/data/onboarding"
import { DEPARTMENTS } from "@/lib/data/types"

// Hiring is a business transition, not four independent CRUD calls. It moves a
// candidate to "hired", creates their directory row, grants the standard leave
// entitlement and generates a real onboarding checklist in ONE transaction.
// A failed write rolls the whole thing back, so no half-hired employee exists.

const WORKSPACE_ID = "__workspace__"
const KEYS = ["recruitment", "employees", "leave", "onboarding"] as const

const bodySchema = z.object({ candidateId: z.string().min(1) })

type StoredDoc = {
  id: string
  key: string
  updatedAt: Date
  data: Prisma.JsonValue
}

const asJson = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "candidateId is required." }, { status: 400 })
  }

  const rows = (await prisma.moduleState.findMany({
    where: { userId: WORKSPACE_ID, key: { in: [...KEYS] } },
  })) as StoredDoc[]

  const byKey = new Map(rows.map((r) => [r.key, r]))
  const recruitment = (byKey.get("recruitment")?.data ?? defaultRecruitmentStore) as RecruitmentStore
  const employees = (byKey.get("employees")?.data ?? defaultEmployees) as Employee[]
  const leave = (byKey.get("leave")?.data ?? defaultLeaveStore) as LeaveStore
  const onboarding = (byKey.get("onboarding")?.data ?? defaultOnboardingStore) as OnboardingStore

  const candidate = (recruitment.candidates ?? []).find((c) => c.id === parsed.data.candidateId)
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 })
  }

  // Idempotent: clicking "Hire" twice returns the same employee rather than
  // creating a duplicate directory row.
  if (candidate.employeeId) {
    const existingTasks = (
      (byKey.get("onboarding")?.data as { tasks?: Array<{ employeeId?: string }> })?.tasks ?? []
    ).filter((t) => t.employeeId === candidate.employeeId).length
    return NextResponse.json({
      ok: true,
      employeeId: candidate.employeeId,
      alreadyHired: true,
      onboardingTasks: existingTasks,
    })
  }

  if (!DEPARTMENTS.includes(candidate.department as (typeof DEPARTMENTS)[number])) {
    return NextResponse.json({ error: "Candidate has an unknown department." }, { status: 400 })
  }

  const email = String(candidate.email ?? "").trim().toLowerCase()
  if (email && employees.some((e) => String(e.email ?? "").toLowerCase() === email)) {
    return NextResponse.json(
      { error: "An employee with this email already exists. Link that record instead." },
      { status: 409 },
    )
  }

  const hiredAt = new Date().toISOString().slice(0, 10)
  const employee = newEmployee({
    name: candidate.name,
    email: email,
    department: candidate.department as Employee["department"],
    role: candidate.role,
    location: "Remote",
    status: "active",
    phone: candidate.phone || undefined,
    employmentType: "full-time",
    salary: candidate.offeredSalary,
    salaryCurrency: candidate.salaryCurrency || "USD",
    salaryEffectiveDate: hiredAt,
  })

  const checklist = buildOnboardingChecklist(employee, new Date(hiredAt))
  const nextRecruitment: RecruitmentStore = {
    ...recruitment,
    candidates: recruitment.candidates.map((c) =>
      c.id === candidate.id
        ? { ...c, stage: "hired" as const, employeeId: employee.id, offerDate: c.offerDate ?? hiredAt }
        : c,
    ),
  }
  const nextEmployees: Employee[] = [employee, ...employees]
  const nextLeave: LeaveStore = {
    ...leave,
    balances: { ...leave.balances, [employee.id]: defaultBalances },
  }
  const nextOnboarding: OnboardingStore = {
    tasks: [
      ...onboarding.tasks.filter((t) => t.employeeId !== employee.id),
      ...checklist,
    ],
  }

  const writes: Array<{ key: string; id?: string; updatedAt?: Date; data: unknown }> = [
    { key: "recruitment", id: byKey.get("recruitment")?.id, updatedAt: byKey.get("recruitment")?.updatedAt, data: nextRecruitment },
    { key: "employees", id: byKey.get("employees")?.id, updatedAt: byKey.get("employees")?.updatedAt, data: nextEmployees },
    { key: "leave", id: byKey.get("leave")?.id, updatedAt: byKey.get("leave")?.updatedAt, data: nextLeave },
    { key: "onboarding", id: byKey.get("onboarding")?.id, updatedAt: byKey.get("onboarding")?.updatedAt, data: nextOnboarding },
  ]

  try {
    await prisma.$transaction(async (tx) => {
      for (const write of writes) {
        if (write.id && write.updatedAt) {
          // Optimistic concurrency: if another admin changed the document
          // between our read and write, abort the whole hire and let the UI
          // retry instead of silently overwriting their change.
          const swapped = await tx.moduleState.updateMany({
            where: { id: write.id, updatedAt: write.updatedAt },
            data: { data: asJson(write.data) },
          })
          if (swapped.count !== 1) throw new Error("Workspace changed during hire; please retry.")
        } else {
          await tx.moduleState.create({
            data: { userId: WORKSPACE_ID, key: write.key, data: asJson(write.data) },
          })
        }
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete the hire."
    return NextResponse.json({ error: message }, { status: 409 })
  }

  // Best-effort side effects — they must never undo a committed hire.
  await Promise.allSettled([
    recordActivity({
      actor: {
        id: auth.session.user.id,
        name: auth.session.user.name ?? null,
        department: auth.session.user.department ?? null,
        role: auth.session.user.role,
      },
      action: "created",
      module: "recruitment",
      summary: `Hired ${candidate.name} and created ${checklist.length} onboarding task(s)`,
    }),
    notifyNewHire({
      employeeName: candidate.name,
      department: employee.department,
      hiredBy: auth.session.user.name ?? "an admin",
      actorId: auth.session.user.id,
    }),
  ])

  return NextResponse.json({
    ok: true,
    employeeId: employee.id,
    onboardingTasks: checklist.length,
  })
}
