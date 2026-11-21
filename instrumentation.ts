// Server instrumentation. In the Node runtime we run a durable job queue:
// a 30-second worker poll, a 10-minute scheduler that enqueues periodic jobs,
// and one deferred tick on startup. All timers are unref'd so they never keep a
// worker process alive. Global flags make this HMR-safe in development.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const globals = globalThis as typeof globalThis & {
    __peoplehrJobsBoot?: boolean
    __peoplehrJobsTimer?: ReturnType<typeof setInterval>
    __peoplehrJobsScheduler?: ReturnType<typeof setInterval>
  }
  if (globals.__peoplehrJobsBoot || globals.__peoplehrJobsTimer) return
  globals.__peoplehrJobsBoot = true

  // Imported lazily so the edge bundle never pulls in Prisma/auth code.
  const { runPendingJobs } = await import("@/lib/jobs/worker")
  const { enqueueJob } = await import("@/lib/jobs/queue")

  const fire = (promise: Promise<unknown>): void => {
    void promise.catch(() => {})
  }
  const unref = (timer: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>): void => {
    const maybe = timer as { unref?: () => void }
    if (typeof maybe.unref === "function") maybe.unref()
  }

  const dateKey = (date: Date): string => date.toISOString().slice(0, 10)
  // 10-minute bucket: the schedule check runs every 10 minutes, and the
  // deterministic id dedupes any duplicate enqueue inside the same bucket.
  const bucketKey = (date: Date): string => {
    const minutes = Math.floor(date.getUTCMinutes() / 10) * 10
    return `${dateKey(date)}:${String(date.getUTCHours()).padStart(2, "0")}${String(minutes).padStart(2, "0")}`
  }

  const schedulePeriodicWork = async (): Promise<void> => {
    const now = new Date()
    await enqueueJob({
      id: `report.schedule_check:${bucketKey(now)}`,
      type: "report.schedule_check",
      payload: { scheduledAt: now.toISOString() },
    })
    await enqueueJob({
      id: `onboarding.reminder:${dateKey(now)}`,
      type: "onboarding.reminder",
      payload: { date: dateKey(now) },
    })
  }

  // One immediate tick (deferred one second so the server finishes booting).
  const boot = setTimeout(() => {
    fire(
      (async () => {
        await schedulePeriodicWork()
        await runPendingJobs()
      })(),
    )
  }, 1000)
  unref(boot)

  const workerTimer = setInterval(() => {
    fire(runPendingJobs())
  }, 30_000)
  const schedulerTimer = setInterval(() => {
    fire(schedulePeriodicWork())
  }, 10 * 60_000)

  unref(workerTimer)
  unref(schedulerTimer)
  globals.__peoplehrJobsTimer = workerTimer
  globals.__peoplehrJobsScheduler = schedulerTimer
}
