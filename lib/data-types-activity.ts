// Types + small pure helpers for the organization-wide activity log.
// This module is deliberately free of server-only imports so both API routes
// and client components can import it.

export const ACTIVITY_ACTIONS = [
  "created",
  "updated",
  "deleted",
  "approved",
  "declined",
  "auth",
  "system",
] as const

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number]

/** The identity attached to an event, used for server-side visibility filtering. */
export type ActivityScope = {
  actorId: string
  department: string | null
  role: string
}

/** Actor information supplied by the caller when recording a new event. */
export type ActivityActor = {
  id: string
  name: string | null
  department: string | null
  role: string
}

export type ActivityEvent = {
  id: string
  /** ISO timestamp. */
  at: string
  actorId: string
  actorName: string
  action: ActivityAction
  module: string
  /** Short, value-free human summary (counts + labels only). */
  summary: string
  scope: ActivityScope
}

/** Modules that produce activity events (used to build the UI filter). */
export const ACTIVITY_MODULES = [
  "employees",
  "leave",
  "recruitment",
  "projects",
  "goals",
  "payroll",
  "performance",
  "onboarding",
  "attendance",
  "organization",
  "reports",
  "documents",
  "announcements",
  "settings",
  "assistant",
  "auth",
] as const

export const MODULE_LABELS: Record<string, string> = {
  employees: "employees",
  leave: "leave records",
  recruitment: "candidates",
  projects: "projects",
  goals: "goals",
  payroll: "payroll records",
  performance: "reviews",
  onboarding: "onboarding tasks",
  attendance: "check-ins",
  organization: "organization details",
  reports: "reports",
  documents: "documents",
  announcements: "announcements",
  settings: "settings",
  assistant: "assistant settings",
  auth: "account activity",
}

export function moduleLabel(key: string): string {
  if (MODULE_LABELS[key]) return MODULE_LABELS[key]
  return key
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Validates a value read back from the JSON document before it reaches the UI. */
export function isActivityEvent(value: unknown): value is ActivityEvent {
  if (!value || typeof value !== "object") return false
  const event = value as Record<string, unknown>
  const scope = event.scope
  if (!scope || typeof scope !== "object") return false
  const s = scope as Record<string, unknown>
  return (
    typeof event.id === "string" &&
    typeof event.at === "string" &&
    typeof event.actorId === "string" &&
    typeof event.actorName === "string" &&
    typeof event.action === "string" &&
    (ACTIVITY_ACTIONS as readonly string[]).includes(event.action) &&
    typeof event.module === "string" &&
    typeof event.summary === "string" &&
    typeof s.actorId === "string" &&
    (s.department === null || typeof s.department === "string") &&
    typeof s.role === "string"
  )
}
