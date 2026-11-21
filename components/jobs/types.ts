// Local view model for the background-jobs queue. The queue is a virtual
// collection (not a ModuleState document), so the API response is normalized
// here and kept defensive: optional fields may be absent, and field names may
// vary slightly between worker versions.

export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "dead"
  | "unknown"

export type Job = {
  id: string
  type: string
  payload: unknown
  status: JobStatus
  attempts: number
  maxAttempts: number
  createdAt: string
  runAfter: string
  startedAt: string | null
  finishedAt: string | null
  lastError: string | null
  result: unknown
}

export type JobStats = {
  queued?: number
  running?: number
  succeeded?: number
  failed?: number
  dead?: number
  total?: number
}

export type JobsResponse = { jobs: Job[]; stats: JobStats }

export const JOB_TYPES: { value: string; label: string }[] = [
  { value: "report.schedule_check", label: "Schedule check" },
  { value: "report.generate", label: "Generate report" },
  { value: "notification.create", label: "Create notification" },
  { value: "onboarding.reminder", label: "Onboarding reminder" },
]

const JOB_TYPE_LABELS: Record<string, string> = {
  "report.generate": "Generate report",
  "report.schedule_check": "Schedule check",
  "notification.create": "Create notification",
  "onboarding.reminder": "Onboarding reminder",
}

export function jobTypeLabel(type: string): string {
  return JOB_TYPE_LABELS[type] ?? type
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const KNOWN_STATUSES: JobStatus[] = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "dead",
]

function readString(
  source: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim().length > 0) return value
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function readNumber(
  source: Record<string, unknown>,
  keys: string[],
  fallback: number,
): number {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (
      typeof value === "string" &&
      value.trim().length > 0 &&
      Number.isFinite(Number(value))
    ) {
      return Number(value)
    }
  }
  return fallback
}

function readOptionalNumber(
  source: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (
      typeof value === "string" &&
      value.trim().length > 0 &&
      Number.isFinite(Number(value))
    ) {
      return Number(value)
    }
  }
  return undefined
}

function normalizeStatus(value: unknown): JobStatus {
  if (typeof value !== "string") return "unknown"
  const lower = value.toLowerCase()
  return KNOWN_STATUSES.find((status) => status === lower) ?? "unknown"
}

function normalizeJob(raw: unknown, index: number): Job {
  const record = isRecord(raw) ? raw : {}
  return {
    id: readString(record, ["id", "_id", "jobId"]) ?? `job-${index + 1}`,
    type: readString(record, ["type", "name", "kind", "jobType"]) ?? "unknown",
    payload: record.payload ?? record.data ?? null,
    status: normalizeStatus(record.status ?? record.state),
    attempts: readNumber(record, ["attempts", "tryCount", "tries"], 0),
    maxAttempts: readNumber(
      record,
      ["maxAttempts", "max_attempts", "maxTries"],
      3,
    ),
    createdAt: readString(record, ["createdAt", "created_at", "created"]) ?? "",
    runAfter:
      readString(record, ["runAfter", "run_after", "scheduledFor"]) ?? "",
    startedAt: readString(record, ["startedAt", "started_at"]) ?? null,
    finishedAt: readString(record, ["finishedAt", "finished_at"]) ?? null,
    lastError:
      readString(record, ["lastError", "last_error", "error"]) ?? null,
    result: record.result ?? null,
  }
}

export function normalizeJobsResponse(raw: unknown): JobsResponse {
  const record = isRecord(raw) ? raw : {}
  const rawJobs = Array.isArray(record.jobs)
    ? record.jobs
    : Array.isArray(record.data)
      ? record.data
      : []
  const rawStats = isRecord(record.stats) ? record.stats : {}
  return {
    jobs: rawJobs.map(normalizeJob),
    stats: {
      queued: readOptionalNumber(rawStats, ["queued", "pending"]),
      running: readOptionalNumber(rawStats, ["running", "active"]),
      succeeded: readOptionalNumber(rawStats, ["succeeded", "completed"]),
      failed: readOptionalNumber(rawStats, ["failed"]),
      dead: readOptionalNumber(rawStats, ["dead", "exhausted"]),
      total: readOptionalNumber(rawStats, ["total", "count"]),
    },
  }
}

export function payloadSummary(payload: unknown): string | null {
  if (!isRecord(payload)) return null
  const parts = Object.entries(payload).slice(0, 2).map(([key, value]) => {
    let text: string
    if (typeof value === "string") text = value
    else if (typeof value === "number" || typeof value === "boolean") {
      text = String(value)
    } else if (value === null) text = "null"
    else text = "…"
    if (text.length > 24) text = `${text.slice(0, 24)}…`
    return `${key}: ${text}`
  })
  return parts.length > 0 ? parts.join(" · ") : null
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}
