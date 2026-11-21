// Worker tick: claim due jobs, dispatch to registered handlers, record the
// outcome. SERVER-ONLY (pulls in queue/handlers → Prisma).
//
// A module-level flag prevents overlapping ticks within one process. Multiple
// processes are safe too: claiming is an atomic CAS on the queue document.

import { claimJobs, completeJob, failJob } from "./queue"
import { JOB_HANDLERS } from "./handlers"
import { logJobError } from "./types"

let running = false

export type WorkerTickResult = { claimed: number; succeeded: number; failed: number }

/** Process up to `limit` due jobs. One job's failure never stops the batch. */
export async function runPendingJobs(limit = 5): Promise<WorkerTickResult> {
  if (running) return { claimed: 0, succeeded: 0, failed: 0 }
  running = true
  try {
    const jobs = await claimJobs(limit)
    let succeeded = 0
    let failed = 0
    for (const job of jobs) {
      try {
        const handler = JOB_HANDLERS[job.type]
        if (!handler) throw new Error(`No handler registered for job type: ${job.type}`)
        const result = await handler(job)
        await completeJob(job.id, result)
        succeeded += 1
      } catch (error) {
        failed += 1
        try {
          await failJob(job.id, error)
        } catch (failError) {
          logJobError(`could not record failure for ${job.id}`, failError)
        }
      }
    }
    return { claimed: jobs.length, succeeded, failed }
  } catch (error) {
    logJobError("worker tick failed", error)
    return { claimed: 0, succeeded: 0, failed: 0 }
  } finally {
    running = false
  }
}
