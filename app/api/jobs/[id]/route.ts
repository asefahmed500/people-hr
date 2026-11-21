// Admin-only job actions: retry a dead/failed job or cancel (remove) one.

import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth-guards"
import { cancelJob, getJob, retryJob } from "@/lib/jobs/queue"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

const actionSchema = z.object({ action: z.enum(["retry", "cancel"]) })

export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Action must be "retry" or "cancel".' }, { status: 400 })
  }

  if (parsed.data.action === "cancel") {
    const removed = await cancelJob(id)
    if (!removed) return NextResponse.json({ error: "Job not found." }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  const existing = await getJob(id)
  if (!existing) return NextResponse.json({ error: "Job not found." }, { status: 404 })
  if (existing.status !== "dead" && existing.status !== "failed") {
    return NextResponse.json({ error: "Only failed or dead jobs can be retried." }, { status: 409 })
  }
  const job = await retryJob(id)
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 })
  return NextResponse.json({ job })
}
