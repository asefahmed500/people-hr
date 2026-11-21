// Real job handlers. Add a new job type by adding it to `JOB_TYPES` in
// types.ts and one entry here — TypeScript enforces full coverage.
// SERVER-ONLY: imports Prisma and the reports route (lazily).

import { prisma } from "@/lib/db"
import type { OnboardingStore } from "@/lib/data/onboarding"

import { enqueueJob } from "./queue"
import type { Job, JobResult, JobType } from "./types"

const WORKSPACE_ID = "__workspace__"

export type JobHandler = (job: Job) => Promise<JobResult>

type NotificationPayload = {
  userId: string
  type: string
  title: string
  description: string
  timestamp: string
  href?: string
}

function notificationPayload(payload: Job["payload"]): NotificationPayload | null {
  const { userId, title, description, href, type, timestamp } = payload
  if (typeof userId !== "string" || !userId.trim()) return null
  if (typeof title !== "string" || !title.trim()) return null
  if (typeof description !== "string") return null
  return {
    userId,
    title,
    description,
    type: typeof type === "string" && type.trim() ? type : "job_notification",
    timestamp:
      typeof timestamp === "string" && timestamp.trim()
        ? timestamp
        : new Date().toISOString().split("T")[0],
    href: typeof href === "string" && href.trim() ? href : undefined,
  }
}

/** Recheck due report schedules. `runDueReports` is idempotent (period ledger),
 *  so never enqueue a second "generate" job here — that would double-generate. */
async function handleScheduleCheck(job: Job): Promise<JobResult> {
  void job // handler signature is uniform across the registry
  const { runDueReports } = await import("@/app/api/reports/run-due/route")
  const summary = await runDueReports()
  return {
    checked: summary.checked,
    ran: summary.ran.length,
    skipped: summary.skipped,
    errors: summary.errors,
  }
}

/**
 * Generate a single report from live module data. Delegates to the reports
 * route's exported helper so row selection, CAS persistence and admin fan-out
 * are identical to a scheduled export. Does not touch the schedule ledger —
 * this is an explicit, one-off export requested via the Jobs dialog.
 */
async function handleReportGenerate(job: Job): Promise<JobResult> {
  const name = typeof job.payload.name === "string" ? job.payload.name : ""
  const type = typeof job.payload.type === "string" ? job.payload.type : ""
  const tone = typeof job.payload.tone === "string" ? job.payload.tone : undefined
  const { generateReport } = await import("@/app/api/reports/run-due/route")
  const result = await generateReport({ name, type, tone })
  return { ...result }
}

/** Create one in-app Notification row. Mirrors the body shape of /api/notifications. */
async function handleNotificationCreate(job: Job): Promise<JobResult> {
  const input = notificationPayload(job.payload)
  if (!input) throw new Error("Invalid notification payload.")

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  })
  if (!user) throw new Error(`Notification target ${input.userId} was not found.`)

  const created = await prisma.notification.create({
    data: {
      id: `n-${crypto.randomUUID()}`,
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      timestamp: input.timestamp,
      read: false,
      href: input.href ?? null,
    },
  })
  return { created: true, id: created.id }
}

/**
 * Scan the workspace onboarding document for incomplete tasks and queue one
 * notification per active admin/manager. Deterministic job ids dedupe to one
 * reminder per recipient per day, so repeated ticks are harmless.
 */
async function handleOnboardingReminder(job: Job): Promise<JobResult> {
  const doc = await prisma.moduleState.findUnique({
    where: { userId_key: { userId: WORKSPACE_ID, key: "onboarding" } },
  })
  const tasks = ((doc?.data as OnboardingStore | null)?.tasks ?? []).filter((task) => task && !task.done)
  if (tasks.length === 0) return { incomplete: 0, reminders: 0 }

  const recipients = await prisma.user.findMany({
    where: { role: { in: ["admin", "manager"] }, deactivatedAt: null },
    select: { id: true },
  })
  if (recipients.length === 0) return { incomplete: tasks.length, reminders: 0 }

  const date =
    typeof job.payload.date === "string" && job.payload.date.trim()
      ? job.payload.date
      : new Date().toISOString().slice(0, 10)

  let reminders = 0
  for (const recipient of recipients) {
    const queued = await enqueueJob({
      id: `notification.create:onboarding:${date}:${recipient.id}`,
      type: "notification.create",
      payload: {
        userId: recipient.id,
        type: "onboarding_reminder",
        title: "Onboarding tasks pending",
        description: `${tasks.length} onboarding task${tasks.length === 1 ? "" : "s"} still incomplete.`,
        href: "/onboarding",
      },
    })
    if (queued) reminders += 1
  }
  return { incomplete: tasks.length, reminders }
}

/** Registry of every supported job type. The API only accepts keys in here. */
export const JOB_HANDLERS: Record<JobType, JobHandler> = {
  "report.schedule_check": handleScheduleCheck,
  "report.generate": handleReportGenerate,
  "notification.create": handleNotificationCreate,
  "onboarding.reminder": handleOnboardingReminder,
}
