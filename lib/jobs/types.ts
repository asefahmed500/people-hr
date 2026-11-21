// Pure types and helpers for the durable background-jobs queue.
//
// SERVER-ONLY IN PRACTICE: this module itself has no Prisma imports (so unit
// tests can import the pure helpers), but `queue.ts`, `worker.ts` and
// `handlers.ts` do — never import those from client code. The queue is a JSON
// document in ModuleState, so there is no schema change or new dependency.

// Reserved scope/key — deliberately outside the store API's known module keys.
export const JOBS_SCOPE = "__jobs__"
export const JOBS_KEY = "queue"

export const MAX_STORED_JOBS = 300
export const DEFAULT_MAX_ATTEMPTS = 3
export const BASE_BACKOFF_MS = 10_000
export const MAX_BACKOFF_MS = 15 * 60_000
export const STALE_RUNNING_MS = 15 * 60_000

/** Single source of truth for job types. `JOB_HANDLERS` must cover every value. */
export const JOB_TYPES = [
  "report.schedule_check",
  "report.generate",
  "notification.create",
  "onboarding.reminder",
] as const
export type JobType = (typeof JOB_TYPES)[number]

export const JOB_STATUSES = ["queued", "running", "succeeded", "failed", "dead"] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export type JobPayload = Record<string, unknown>
export type JobResult = Record<string, unknown>

export interface Job {
  id: string
  type: JobType
  payload: JobPayload
  status: JobStatus
  /** Number of claim attempts made so far (incremented when a worker claims it). */
  attempts: number
  maxAttempts: number
  createdAt: string
  /** ISO instant before which the job must not be claimed. */
  runAfter: string
  startedAt?: string
  finishedAt?: string
  lastError?: string
  result?: JobResult
}

export interface EnqueueOptions {
  type: JobType
  payload?: JobPayload
  runAfter?: string
  maxAttempts?: number
  /**
   * Deterministic id. Re-enqueueing an id that already exists is a no-op,
   * which is how the scheduler dedupes its periodic jobs.
   */
  id?: string
}

export interface JobStats extends Record<JobStatus, number> {
  total: number
}

// --- pure helpers ------------------------------------------------------------

/** Message only — no stack traces, bounded length, safe for storage/logs. */
export function normalizeError(error: unknown): string {
  let raw: string
  if (error instanceof Error) {
    raw = error.message
  } else if (typeof error === "string") {
    raw = error
  } else {
    try {
      raw = JSON.stringify(error) ?? String(error)
    } catch {
      raw = String(error)
    }
  }
  return raw.replace(/\s+/g, " ").trim().slice(0, 500) || "Unknown error"
}

/** Log a job error with a stable prefix and never a stack trace. */
export function logJobError(context: string, error: unknown): void {
  console.error(`[jobs] ${context}: ${normalizeError(error)}`)
}

/** Exponential backoff with a cap; deterministic so it is unit-testable. */
export function backoffDelayMs(
  attempts: number,
  baseMs: number = BASE_BACKOFF_MS,
  capMs: number = MAX_BACKOFF_MS,
): number {
  const n = Math.max(0, Math.floor(Number.isFinite(attempts) ? attempts : 0))
  const base = Math.max(0, Number.isFinite(baseMs) ? baseMs : BASE_BACKOFF_MS)
  const cap = Math.max(base, Number.isFinite(capMs) ? capMs : MAX_BACKOFF_MS)
  return Math.min(cap, base * 2 ** Math.min(n, 20))
}

export type RetryDecision = {
  status: "queued" | "dead"
  runAfter: string
  finishedAt?: string
}

/** Decide what happens after attempt N failed. N >= maxAttempts means dead. */
export function retryDecision(
  attempts: number,
  maxAttempts: number,
  nowMs: number,
): RetryDecision {
  const used = Math.max(0, Math.floor(Number.isFinite(attempts) ? attempts : 0))
  const max = Math.max(1, Math.floor(Number.isFinite(maxAttempts) ? maxAttempts : DEFAULT_MAX_ATTEMPTS))
  const stamp = new Date(Number.isFinite(nowMs) ? nowMs : Date.now()).toISOString()
  if (used >= max) return { status: "dead", runAfter: stamp, finishedAt: stamp }
  return { status: "queued", runAfter: new Date((Number.isFinite(nowMs) ? nowMs : Date.now()) + backoffDelayMs(used)).toISOString() }
}

const TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  queued: ["running", "failed", "dead"],
  running: ["succeeded", "queued", "failed", "dead"],
  failed: ["queued", "dead"],
  succeeded: [],
  dead: [],
}

export function isTerminal(status: JobStatus): boolean {
  return status === "succeeded" || status === "dead"
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  if (isTerminal(from)) return false
  return TRANSITIONS[from].includes(to) || (from === to && !isTerminal(from))
}

export function isDue(job: Job, nowMs: number): boolean {
  if (job.status !== "queued") return false
  const due = Date.parse(job.runAfter)
  return !Number.isNaN(due) && due <= nowMs
}

export function isStaleRunning(
  job: Job,
  nowMs: number,
  timeoutMs: number = STALE_RUNNING_MS,
): boolean {
  if (job.status !== "running") return false
  if (!job.startedAt) return true
  const started = Date.parse(job.startedAt)
  return Number.isNaN(started) || nowMs - started >= timeoutMs
}

/**
 * Cap the stored document at ~300 jobs. Prefer dropping the oldest terminal
 * work first; never discard running jobs, and only drop queued work as a last
 * resort.
 */
export function trimJobs(jobs: Job[], max: number = MAX_STORED_JOBS): Job[] {
  const limit = Math.max(1, Math.floor(Number.isFinite(max) ? max : MAX_STORED_JOBS))
  if (jobs.length <= limit) return jobs
  const ordered = [...jobs].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  )
  const removed = new Set<string>()
  const dropOldestMatching = (predicate: (job: Job) => boolean) => {
    for (const job of ordered) {
      if (jobs.length - removed.size <= limit) return
      if (predicate(job)) removed.add(job.id)
    }
  }
  dropOldestMatching((job) => isTerminal(job.status))
  dropOldestMatching((job) => job.status === "failed")
  dropOldestMatching((job) => job.status === "queued")
  return jobs.filter((job) => !removed.has(job.id))
}

/** Narrow an untrusted stored entry to a Job before trusting its fields. */
export function isJobLike(value: unknown): value is Job {
  if (!value || typeof value !== "object") return false
  const job = value as Record<string, unknown>
  return (
    typeof job.id === "string" &&
    typeof job.type === "string" &&
    (JOB_TYPES as readonly string[]).includes(job.type) &&
    typeof job.status === "string" &&
    (JOB_STATUSES as readonly string[]).includes(job.status) &&
    typeof job.attempts === "number" &&
    Number.isFinite(job.attempts) &&
    typeof job.maxAttempts === "number" &&
    Number.isFinite(job.maxAttempts) &&
    typeof job.createdAt === "string" &&
    typeof job.runAfter === "string"
  )
}
