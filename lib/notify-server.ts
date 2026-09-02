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

/** Active admins + managers of one department, minus the actor. */
async function approverIds(department: string | null, actorId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { deactivatedAt: null, role: { in: ["admin", "manager"] } },
    select: { id: true, role: true, department: true },
  })
  return users
    .filter((u) => u.id !== actorId)
    .filter((u) => u.role === "admin" || (department != null && u.department === department))
    .map((u) => u.id)
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

    const added: NotificationInput[] = []
    const decided: NotificationInput[] = []

    for (const row of mergedArr) {
      const prev = storedById.get(String(row.id))
      const owner = String(row.employeeId ?? "")
      const label = `${row.employeeName ?? "Someone"} · ${row.days ?? "?"} day(s)`

      if (!prev) {
        if (row.status !== "pending") continue
        const targets = await approverIds(null, opts.actorId)
        // Department managers only need their own dept's queue — the merge
        // view already scopes them, so a dept-wide fan-out to all managers is
        // refined here by resolving the requester's department on the fly.
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
        const targets = await approverIds(null, opts.actorId)
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
