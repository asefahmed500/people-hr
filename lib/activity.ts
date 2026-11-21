// Server-side activity log. Events live in a reserved ModuleState row so they
// survive restarts without a schema change. Recording is best-effort: it never
// throws, so a failed audit write can never fail the save that triggered it.

import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import {
  isActivityEvent,
  moduleLabel,
  type ActivityAction,
  type ActivityActor,
  type ActivityEvent,
} from "@/lib/data-types-activity"

const ACTIVITY_USER_ID = "__activity__"
const ACTIVITY_KEY = "workspace"
const MAX_EVENTS = 200

type ActivityDocument = { events?: ActivityEvent[] }

function eventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function asDocument(data: Prisma.JsonValue | null): ActivityDocument {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {}
  const value = data as Record<string, unknown>
  if (!Array.isArray(value.events)) return {}
  return { events: value.events.filter(isActivityEvent) }
}

/**
 * Append one event to the activity log. Each event is its own ModuleState row,
 * so concurrent writers can never collide on a shared document (the old CAS
 * approach silently dropped events under load). Errors are swallowed so audit
 * failure can never break the save that triggered it.
 */
export async function recordActivity(input: {
  actor: ActivityActor
  action: ActivityAction
  module: string
  summary: string
}): Promise<void> {
  const event: ActivityEvent = {
    id: eventId(),
    at: new Date().toISOString(),
    actorId: input.actor.id,
    actorName: input.actor.name?.trim() || "Team Member",
    action: input.action,
    module: input.module,
    summary: input.summary,
    scope: {
      actorId: input.actor.id,
      department: input.actor.department ?? null,
      role: input.actor.role,
    },
  }

  try {
    await prisma.moduleState.create({
      data: {
        userId: ACTIVITY_USER_ID,
        key: `event:${event.id}`,
        data: event as unknown as Prisma.InputJsonValue,
      },
    })
    // Best-effort pruning of the oldest per-event rows.
    const all = await prisma.moduleState.findMany({
      where: { userId: ACTIVITY_USER_ID, key: { startsWith: "event:" } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    })
    if (all.length > MAX_EVENTS) {
      await prisma.moduleState.deleteMany({
        where: { id: { in: all.slice(MAX_EVENTS).map((r) => r.id) } },
      })
    }
  } catch (error) {
    console.error("[activity] could not record event", error)
  }
}

/** Read stored events, newest first, including legacy single-document rows. */
export async function readActivityEvents(): Promise<ActivityEvent[]> {
  const [rows, legacy] = await Promise.all([
    prisma.moduleState.findMany({
      where: { userId: ACTIVITY_USER_ID, key: { startsWith: "event:" } },
    }),
    prisma.moduleState.findUnique({
      where: { userId_key: { userId: ACTIVITY_USER_ID, key: ACTIVITY_KEY } },
    }),
  ])
  const events = rows.map((r) => r.data).filter(isActivityEvent)
  events.push(...(asDocument(legacy?.data ?? null).events ?? []))
  return events.sort((a, b) => b.at.localeCompare(a.at))
}

// ---------------------------------------------------------------------------
// Generic before/after diffing. No per-module business logic — only counts and
// labels, so no document bodies or field values ever reach the activity log.
// ---------------------------------------------------------------------------

type FlatRow = { key: string; value: string }

function stableValue(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "null"
  } catch {
    return String(value)
  }
}

function rowKey(value: unknown, index: number): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>
    for (const field of ["id", "_id", "key", "name", "email", "title"]) {
      const candidate = row[field]
      if (typeof candidate === "string" || typeof candidate === "number") {
        return `${field}:${String(candidate)}`
      }
    }
  }
  return `index:${index}`
}

/** Flatten a module document into identity → value pairs for comparison. */
function flatten(document: unknown): FlatRow[] {
  const rows: FlatRow[] = []
  if (Array.isArray(document)) {
    document.forEach((value, index) => {
      rows.push({ key: `row:${rowKey(value, index)}`, value: stableValue(value) })
    })
    return rows
  }
  if (document && typeof document === "object") {
    for (const [key, value] of Object.entries(document as Record<string, unknown>)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          rows.push({ key: `${key}:${rowKey(item, index)}`, value: stableValue(item) })
        })
      } else if (value && typeof value === "object") {
        // Maps such as leave balances: compare each entry independently.
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          rows.push({ key: `${key}:${nestedKey}`, value: stableValue(nestedValue) })
        }
      } else {
        rows.push({ key, value: stableValue(value) })
      }
    }
  }
  return rows
}

/** Derive an action + value-free summary from a successful document replace. */
export function describeDocumentChange(
  module: string,
  before: unknown,
  after: unknown,
): { action: ActivityAction; summary: string } {
  const beforeMap = new Map(flatten(before).map((row) => [row.key, row.value]))
  const afterMap = new Map(flatten(after).map((row) => [row.key, row.value]))

  let added = 0
  let changed = 0
  let removed = 0
  for (const [key, value] of afterMap) {
    if (!beforeMap.has(key)) added++
    else if (beforeMap.get(key) !== value) changed++
  }
  for (const key of beforeMap.keys()) {
    if (!afterMap.has(key)) removed++
  }

  const label = moduleLabel(module)
  const parts: string[] = []
  if (added > 0) parts.push(`Added ${added} ${label}`)
  if (changed > 0) parts.push(`Updated ${changed} ${label}`)
  if (removed > 0) parts.push(`Removed ${removed} ${label}`)

  let action: ActivityAction = "updated"
  if (added > 0 && changed === 0 && removed === 0) action = "created"
  else if (removed > 0 && added === 0 && changed === 0) action = "deleted"

  return { action, summary: parts.length > 0 ? parts.join(", ") : `Saved ${label}` }
}
