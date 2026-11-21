// Durable job queue stored as a single JSON document in ModuleState.
// SERVER-ONLY: imports Prisma and must never be bundled into client code.
//
// All mutations go through a compare-and-swap on `updatedAt` (with retries), so
// two workers/processes can never claim the same job: a loser re-reads the doc
// and sees the winner's `running` flags before trying again.

import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import {
  DEFAULT_MAX_ATTEMPTS,
  JOBS_KEY,
  JOBS_SCOPE,
  canTransition,
  isDue,
  isJobLike,
  isStaleRunning,
  isTerminal,
  logJobError,
  normalizeError,
  retryDecision,
  trimJobs,
  type EnqueueOptions,
  type Job,
  type JobResult,
  type JobStats,
  type JobStatus,
} from "./types"

const CAS_RETRIES = 3
const MAX_LIST_LIMIT = 200

type QueueDoc = { id: string; updatedAt: Date; data: unknown }
type MutationResult<T> = { jobs: Job[]; value: T; changed: boolean }

function makeJobId(type: EnqueueOptions["type"]): string {
  return `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
}

function clampAttempts(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_MAX_ATTEMPTS
  return Math.min(10, Math.max(1, Math.floor(value)))
}

function clampLimit(value: number | undefined, fallback: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(1, Math.floor(value)))
}

function parseJobs(data: unknown): Job[] {
  if (!data || typeof data !== "object") return []
  const jobs = (data as { jobs?: unknown }).jobs
  return Array.isArray(jobs) ? jobs.filter(isJobLike) : []
}

/** CAS write. A missing document is created; a lost race returns false. */
async function persist(jobs: Job[], doc: QueueDoc | null): Promise<boolean> {
  const data = { jobs } as unknown as Prisma.InputJsonValue
  if (!doc) {
    try {
      await prisma.moduleState.create({
        data: { userId: JOBS_SCOPE, key: JOBS_KEY, data },
      })
      return true
    } catch (error) {
      // Unique conflict = another process created it first; retry with a read.
      logJobError("queue create lost a race", error)
      return false
    }
  }
  const swapped = await prisma.moduleState.updateMany({
    where: { id: doc.id, updatedAt: doc.updatedAt },
    data: { data },
  })
  return swapped.count > 0
}

/** Atomic read-modify-CAS-write with a bounded number of retries. */
async function withQueueLock<T>(mutate: (jobs: Job[]) => MutationResult<T>): Promise<T | null> {
  for (let attempt = 0; attempt < CAS_RETRIES; attempt++) {
    try {
      const { doc, jobs } = await readQueue()
      const next = mutate(jobs)
      if (!next.changed) return next.value
      if (await persist(next.jobs, doc)) return next.value
    } catch (error) {
      logJobError(`queue CAS attempt ${attempt + 1} failed`, error)
    }
  }
  console.error(`[jobs] queue mutation failed after ${CAS_RETRIES} attempts`)
  return null
}

/** Read the document once; a missing row is an empty queue, not an error. */
async function readQueue(): Promise<{ doc: QueueDoc | null; jobs: Job[] }> {
  try {
    const doc = await prisma.moduleState.findUnique({
      where: { userId_key: { userId: JOBS_SCOPE, key: JOBS_KEY } },
    })
    return { doc: doc ?? null, jobs: parseJobs(doc?.data) }
  } catch (error) {
    logJobError("could not read queue document", error)
    return { doc: null, jobs: [] }
  }
}

/** Add a job. A deterministic `id` that already exists is left untouched. */
export async function enqueueJob(options: EnqueueOptions): Promise<Job | null> {
  const nowMs = Date.now()
  const nowIso = new Date(nowMs).toISOString()
  const id = options.id?.trim() || makeJobId(options.type)
  const requested = options.runAfter ? Date.parse(options.runAfter) : nowMs
  const job: Job = {
    id,
    type: options.type,
    payload: options.payload ?? {},
    status: "queued",
    attempts: 0,
    maxAttempts: clampAttempts(options.maxAttempts),
    createdAt: nowIso,
    runAfter: Number.isNaN(requested) ? nowIso : new Date(requested).toISOString(),
  }
  const result = await withQueueLock<Job>((jobs) => {
    const existing = jobs.find((candidate) => candidate.id === id)
    if (existing) return { jobs, value: existing, changed: false }
    return { jobs: trimJobs([...jobs, job]), value: job, changed: true }
  })
  if (result === null) logJobError(`could not enqueue ${options.type}`, "queue write failed")
  return result
}

/**
 * Atomically claim up to `limit` due jobs. Each claimed job is marked running
 * (attempts + 1) in the same CAS, so no other process can claim it. Stale
 * running jobs from a crashed worker are recovered on the same pass.
 */
export async function claimJobs(limit = 5): Promise<Job[]> {
  const nowMs = Date.now()
  const nowIso = new Date(nowMs).toISOString()
  const cap = clampLimit(limit, 5, 50)
  const claimed = await withQueueLock<Job[]>((jobs) => {
    let changed = false
    const recovered = jobs.map((job) => {
      if (!isStaleRunning(job, nowMs)) return job
      changed = true
      const decision = retryDecision(job.attempts, job.maxAttempts, nowMs)
      return {
        ...job,
        status: decision.status,
        runAfter: decision.runAfter,
        finishedAt: decision.finishedAt ?? job.finishedAt,
        lastError: "Reclaimed after worker timeout",
      }
    })
    const due = recovered
      .filter((job) => isDue(job, nowMs))
      .sort(
        (a, b) =>
          a.runAfter.localeCompare(b.runAfter) ||
          a.createdAt.localeCompare(b.createdAt) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, cap)
    if (due.length === 0) return { jobs: recovered, value: [], changed }

    const ids = new Set(due.map((job) => job.id))
    const active: Job[] = []
    const next = recovered.map((job) => {
      if (!ids.has(job.id)) return job
      const running: Job = {
        ...job,
        status: "running",
        attempts: job.attempts + 1,
        startedAt: nowIso,
        finishedAt: undefined,
        lastError: undefined,
      }
      active.push(running)
      return running
    })
    return { jobs: next, value: active, changed: true }
  })
  return claimed ?? []
}

export async function completeJob(id: string, result?: JobResult): Promise<Job | null> {
  const finishedAt = new Date().toISOString()
  return withQueueLock<Job | null>((jobs) => {
    const index = jobs.findIndex((job) => job.id === id)
    if (index === -1) return { jobs, value: null, changed: false }
    const job = jobs[index]
    if (!canTransition(job.status, "succeeded")) return { jobs, value: null, changed: false }
    const done: Job = {
      ...job,
      status: "succeeded",
      result: result ?? {},
      startedAt: job.startedAt ?? finishedAt,
      finishedAt,
      lastError: undefined,
    }
    const next = [...jobs]
    next[index] = done
    return { jobs: next, value: done, changed: true }
  })
}

/** Re-queue with backoff while attempts remain, otherwise move to `dead`. */
export async function failJob(id: string, error: unknown): Promise<Job | null> {
  const nowMs = Date.now()
  const message = normalizeError(error)
  return withQueueLock<Job | null>((jobs) => {
    const index = jobs.findIndex((job) => job.id === id)
    if (index === -1) return { jobs, value: null, changed: false }
    const job = jobs[index]
    if (isTerminal(job.status)) return { jobs, value: null, changed: false }
    const decision = retryDecision(job.attempts, job.maxAttempts, nowMs)
    const failed: Job = {
      ...job,
      status: decision.status,
      runAfter: decision.runAfter,
      finishedAt: decision.finishedAt ?? job.finishedAt,
      lastError: message,
    }
    const next = [...jobs]
    next[index] = failed
    return { jobs: next, value: failed, changed: true }
  })
}

/** Manual retry of a dead/failed job with a fresh attempt budget. */
export async function retryJob(id: string): Promise<Job | null> {
  const nowIso = new Date().toISOString()
  return withQueueLock<Job | null>((jobs) => {
    const index = jobs.findIndex((job) => job.id === id)
    if (index === -1) return { jobs, value: null, changed: false }
    const job = jobs[index]
    if (job.status !== "dead" && job.status !== "failed") {
      return { jobs, value: null, changed: false }
    }
    const retried: Job = {
      ...job,
      status: "queued",
      attempts: 0,
      runAfter: nowIso,
      startedAt: undefined,
      finishedAt: undefined,
      lastError: undefined,
      result: undefined,
    }
    const next = [...jobs]
    next[index] = retried
    return { jobs: next, value: retried, changed: true }
  })
}

/** Cancel = remove from the document. Returns false when nothing was removed. */
export async function cancelJob(id: string): Promise<boolean> {
  return (
    (await withQueueLock<boolean>((jobs) => {
      const next = jobs.filter((job) => job.id !== id)
      if (next.length === jobs.length) return { jobs, value: false, changed: false }
      return { jobs: next, value: true, changed: true }
    })) ?? false
  )
}

export async function getJob(id: string): Promise<Job | null> {
  const { jobs } = await readQueue()
  return jobs.find((job) => job.id === id) ?? null
}

export async function listJobs(options: { status?: JobStatus; limit?: number } = {}): Promise<Job[]> {
  const { jobs } = await readQueue()
  const limit = clampLimit(options.limit, 50, MAX_LIST_LIMIT)
  return jobs
    .filter((job) => !options.status || job.status === options.status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .slice(0, limit)
}

export async function getJobStats(): Promise<JobStats> {
  const { jobs } = await readQueue()
  const stats: JobStats = {
    total: jobs.length,
    queued: 0,
    running: 0,
    succeeded: 0,
    failed: 0,
    dead: 0,
  }
  for (const job of jobs) stats[job.status] += 1
  return stats
}
