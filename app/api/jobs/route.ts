// Admin-only background job inspection and manual enqueue.

import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth-guards"
import { JOB_HANDLERS } from "@/lib/jobs/handlers"
import { enqueueJob, getJobStats, listJobs } from "@/lib/jobs/queue"
import { JOB_STATUSES, JOB_TYPES, type JobStatus } from "@/lib/jobs/types"

export const runtime = "nodejs"

const createSchema = z.object({
  type: z.enum(JOB_TYPES),
  payload: z.unknown().optional(),
  runAfter: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid runAfter date.")
    .optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
})

// Per-type payload validation. Loose objects keep room for future metadata.
const payloadSchemas = {
  "report.schedule_check": z.looseObject({ scheduledAt: z.string().optional() }),
  "report.generate": z.looseObject({
    name: z.string().optional(),
    type: z.string().optional(),
    tone: z.string().optional(),
  }),
  "notification.create": z.looseObject({
    userId: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    href: z
      .string()
      .refine((v) => v.startsWith("/") && !/^\/[\\/]/.test(v), "Use an internal path.")
      .optional(),
    type: z.string().optional(),
    timestamp: z.string().optional(),
  }),
  "onboarding.reminder": z.looseObject({ date: z.string().optional() }),
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const url = new URL(request.url)
  const statusParam = url.searchParams.get("status")
  const status =
    statusParam && (JOB_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as JobStatus)
      : undefined
  const requestedLimit = Number(url.searchParams.get("limit") ?? "50")
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(200, Math.floor(requestedLimit))
      : 50

  const [jobs, stats] = await Promise.all([listJobs({ status, limit }), getJobStats()])
  return NextResponse.json({ jobs, stats })
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return badRequest("Invalid job request.")
  if (!(parsed.data.type in JOB_HANDLERS)) return badRequest("Unknown job type.")

  const payloadParsed = payloadSchemas[parsed.data.type].safeParse(parsed.data.payload ?? {})
  if (!payloadParsed.success) return badRequest("Invalid payload for this job type.")

  const job = await enqueueJob({
    type: parsed.data.type,
    payload: payloadParsed.data as Record<string, unknown>,
    runAfter: parsed.data.runAfter,
    maxAttempts: parsed.data.maxAttempts,
  })
  if (!job) return NextResponse.json({ error: "Could not enqueue job." }, { status: 500 })
  return NextResponse.json({ job }, { status: 201 })
}
