import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth-guards"
import { readActivityEvents } from "@/lib/activity"
import type { ActivityEvent } from "@/lib/data-types-activity"

const DEFAULT_LIMIT = 50
const MIN_LIMIT = 1
const MAX_LIMIT = 200

function parseLimit(raw: string | null): number {
  if (raw === null) return DEFAULT_LIMIT
  const value = Number(raw)
  if (!Number.isFinite(value) || value < MIN_LIMIT) return DEFAULT_LIMIT
  return Math.min(MAX_LIMIT, Math.floor(value))
}

// GET /api/activity — role-filtered activity events.
// admins: everything · managers: their department + their own · employees: own only.
export async function GET(request: Request) {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(request.url)
  const limit = parseLimit(searchParams.get("limit"))
  const moduleFilter = searchParams.get("module")?.trim() || null

  let events: ActivityEvent[]
  try {
    events = await readActivityEvents()
  } catch (error) {
    console.error("[activity] could not read activity log", error)
    return NextResponse.json({ error: "Activity is unavailable right now." }, { status: 500 })
  }

  const role = guard.session.user.role
  const userId = guard.session.user.id
  const department = guard.session.user.department ?? null

  const visible = events.filter((event) => {
    if (role === "admin") return true
    if (role === "manager") {
      return (
        event.scope.actorId === userId ||
        (department !== null && event.scope.department === department)
      )
    }
    return event.scope.actorId === userId
  })

  const matching = moduleFilter
    ? visible.filter((event) => event.module === moduleFilter)
    : visible

  return NextResponse.json({
    events: matching.slice(0, limit),
    total: matching.length,
  })
}
