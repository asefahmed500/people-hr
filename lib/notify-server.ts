// Server-side notification generation: notifications are addressed to the
// people who need to act (approvers) or who are affected (the requester) —
// never echoed back to the actor, whose own action feedback is the toast.
import { prisma } from "@/lib/db"

type NotificationInput = {
  userId: string
  type: string
  title: string
  description: string
  href?: string
}

type LeaveRequestRow = {
  id: string
  employeeId: string
  employeeName?: string
  status?: string
  days?: number
  type?: string
}

const nowIso = () => new Date().toISOString().split("T")[0]

async function createMany(inputs: NotificationInput[]) {
  if (inputs.length === 0) return
  await prisma.notification.createMany({
    data: inputs.map((n) => ({
      id: `n-${crypto.randomUUID()}`,
      userId: n.userId,
      type: n.type,
      title: n.title,
      description: n.description,
      timestamp: nowIso(),
      read: false,
      href: n.href ?? null,
    })),
  })
}

/**
 * A scheduled report finished generating. Reports are generated in-app (no
 * email is sent), so notify every active admin that the export is waiting
 * under "Recent exports" on the Reports page. Best-effort like the rest of
 * the notification fan-out.
 */
export async function notifyScheduledReport(opts: {
  reportName: string
  rows: number
}): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin", deactivatedAt: null },
      select: { id: true },
    })
    await createMany(
      admins.map((admin) => ({
        userId: admin.id,
        type: "report_generated",
        title: "Scheduled report generated",
        description: `${opts.reportName} (${opts.rows} ${opts.rows === 1 ? "row" : "rows"}) is ready under Recent exports.`,
        href: "/reports",
      })),
    )
  } catch {
    // Notification fan-out must never fail the report generation.
  }
}

type DirectoryUser = { id: string; name: string | null; role: string; department: string | null }

/** Active admins + managers of one department, minus the actor. */
function approverIds(
  users: DirectoryUser[],
  department: string | null,
  actorId: string,
): string[] {
  return users
    .filter((u) => u.role === "admin" || u.role === "manager")
    .filter((u) => u.id !== actorId)
    .filter((u) => u.role === "admin" || (department != null && u.department === department))
    .map((u) => u.id)
}

/** A pay period was recorded. Other admins/managers can find the rows ready
 *  for export. The actor is never notified about their own action. */
export async function notifyPayrollRecorded(opts: {
  period: string
  count: number
  actorId: string
}): Promise<void> {
  try {
    const users = (await prisma.user.findMany({
      where: { deactivatedAt: null },
      select: { id: true, name: true, role: true, department: true },
    })) as DirectoryUser[]
    await createMany(
      users
        .filter((u) => u.role === "admin" || u.role === "manager")
        .filter((u) => u.id !== opts.actorId)
        .map((u) => ({
          userId: u.id,
          type: "payroll_recorded",
          title: "Payroll recorded",
          description: `${opts.count} payment(s) for ${opts.period} are ready to export. No money was sent.`,
          href: "/payslips",
        })),
    )
  } catch {
    // Notification fan-out must never fail a recorded run.
  }
}

/**
 * A candidate became an employee. Tell the other people responsible for the
 * hire (admins + that department's managers, never the actor) where to pick up
 * the onboarding checklist.
 */
export async function notifyNewHire(opts: {
  employeeName: string
  department: string
  hiredBy: string
  actorId: string
}): Promise<void> {
  try {
    const users = (await prisma.user.findMany({
      where: { deactivatedAt: null },
      select: { id: true, name: true, role: true, department: true },
    })) as DirectoryUser[]
    await createMany(
      approverIds(users, opts.department, opts.actorId).map((userId) => ({
        userId,
        type: "employee_hired",
        title: "New hire added",
        description: `${opts.employeeName} joined ${opts.department} (added by ${opts.hiredBy}). Onboarding checklist is ready.`,
        href: "/onboarding",
      })),
    )
  } catch {
    // Notification fan-out must never fail the hire itself.
  }
}

/**
 * Diff a leave document change and notify the right people:
 * - new pending request        → admins + the requester's department managers
 * - decision (approve/decline) → the request owner
 * - cancellation of a pending  → the other side (owner cancels → approvers;
 *                                approver removes → owner)
 * `actorId` is the signed-in writer; they are never notified about their own
 * action.
 */
export async function notifyLeaveChanges(opts: {
  stored: unknown
  merged: unknown
  actorId: string
  actorName: string
}): Promise<void> {
  try {
    const storedArr = ((opts.stored as { requests?: LeaveRequestRow[] })?.requests ?? []) as LeaveRequestRow[]
    const mergedArr = ((opts.merged as { requests?: LeaveRequestRow[] })?.requests ?? []) as LeaveRequestRow[]
    const storedById = new Map(storedArr.map((r) => [String(r.id), r]))

    // Load the directory once (avoids an N+1 query per changed request) and
    // resolve the requester's own department — not a hard-coded null — so a
    // manager is only notified about leave in their department.
    const users = (await prisma.user.findMany({
      where: { deactivatedAt: null },
      select: { id: true, name: true, role: true, department: true },
    })) as DirectoryUser[]
    const deptById = new Map(users.map((u) => [u.id, u.department]))
    const deptByName = new Map(users.filter((u) => u.name).map((u) => [u.name as string, u.department]))
    const departmentOf = (row: LeaveRequestRow): string | null =>
      (row.employeeId ? deptById.get(row.employeeId) : undefined) ??
      (row.employeeName ? deptByName.get(row.employeeName) : undefined) ??
      null

    const added: NotificationInput[] = []
    const decided: NotificationInput[] = []

    for (const row of mergedArr) {
      const prev = storedById.get(String(row.id))
      const owner = String(row.employeeId ?? "")
      const label = `${row.employeeName ?? "Someone"} · ${row.days ?? "?"} day(s)`

      if (!prev) {
        if (row.status !== "pending") continue
        const targets = approverIds(users, departmentOf(row), opts.actorId)
        // Admins plus managers of the requester's own department only.
        const inputs: NotificationInput[] = targets.map((userId) => ({
          userId,
          type: "leave_requested",
          title: "Leave requested",
          description: `${label} awaiting approval`,
          href: "/leave",
        }))
        added.push(...inputs)
        continue
      }

      if (prev.status === "pending" && (row.status === "approved" || row.status === "declined")) {
        if (owner === opts.actorId || !owner) continue
        decided.push({
          userId: owner,
          type: row.status === "approved" ? "leave_approved" : "leave_declined",
          title: row.status === "approved" ? "Leave approved" : "Leave declined",
          description: `${opts.actorName || "An approver"} ${row.status} your ${row.days ?? "?"}-day request`,
          href: "/leave",
        })
      }
    }

    // Removals: cancellation of a pending request informs the other side.
    const mergedIds = new Set(mergedArr.map((r) => String(r.id)))
    for (const prev of storedArr) {
      if (mergedIds.has(String(prev.id))) continue
      if (prev.status !== "pending") continue
      const owner = String(prev.employeeId ?? "")
      const label = `${prev.employeeName ?? "Someone"} · ${prev.days ?? "?"} day(s)`
      if (owner === opts.actorId) {
        const targets = approverIds(users, departmentOf(prev), opts.actorId)
        added.push(
          ...targets.map((userId) => ({
            userId,
            type: "leave_cancelled",
            title: "Leave request cancelled",
            description: `${label} was cancelled`,
            href: "/leave",
          })),
        )
      } else if (owner) {
        decided.push({
          userId: owner,
          type: "leave_cancelled",
          title: "Leave request removed",
          description: `${opts.actorName || "An approver"} removed a pending ${prev.days ?? "?"}-day request`,
          href: "/leave",
        })
      }
    }

    await createMany([...added, ...decided])
  } catch {
    // Notification fan-out must never fail the underlying data write.
  }
}
