"use client"

import * as React from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { EnqueueJobDialog } from "@/components/jobs/enqueue-job-dialog"
import { JobKpiCards } from "@/components/jobs/job-kpi-cards"
import { JobsFilters } from "@/components/jobs/jobs-filters"
import { JobsHeader } from "@/components/jobs/jobs-header"
import { JobsTable } from "@/components/jobs/jobs-table"
import {
  normalizeJobsResponse,
  type Job,
  type JobsResponse,
} from "@/components/jobs/types"
import { SkeletonCard } from "@/components/shared/skeleton-card"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest } from "@/lib/api-client"
import { notify } from "@/lib/toast"

type JobAction = "retry" | "cancel"

export function JobsPageClient() {
  const [status, setStatus] = React.useState("all")
  const [limit, setLimit] = React.useState("50")
  const [data, setData] = React.useState<JobsResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [enqueueing, setEnqueueing] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status !== "all") params.set("status", status)
      params.set("limit", limit)
      const raw = await apiRequest<unknown>(`/api/jobs?${params.toString()}`)
      setData(normalizeJobsResponse(raw))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load jobs.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [status, limit])

  React.useEffect(() => {
    // Defer the fetch (and its synchronous loading-state update) out of the
    // effect body to avoid cascading renders on mount.
    void Promise.resolve().then(() => load())
  }, [load])

  const counts = React.useMemo(() => {
    const jobs = data?.jobs ?? []
    const stats = data?.stats
    const fromStats = (
      key: "queued" | "running" | "succeeded" | "failed" | "dead",
    ) => stats?.[key]
    const failedStat = fromStats("failed")
    const deadStat = fromStats("dead")
    return {
      queued:
        fromStats("queued") ?? jobs.filter((job) => job.status === "queued").length,
      running:
        fromStats("running") ?? jobs.filter((job) => job.status === "running").length,
      succeeded:
        fromStats("succeeded") ??
        jobs.filter((job) => job.status === "succeeded").length,
      failed:
        failedStat !== undefined || deadStat !== undefined
          ? (failedStat ?? 0) + (deadStat ?? 0)
          : jobs.filter(
              (job) => job.status === "failed" || job.status === "dead",
            ).length,
    }
  }, [data])

  function refresh() {
    setRefreshing(true)
    void load()
  }

  function clearFilters() {
    setStatus("all")
    setLimit("50")
  }

  async function handleAction(job: Job, action: JobAction) {
    setBusyId(job.id)
    try {
      await apiRequest(`/api/jobs/${encodeURIComponent(job.id)}`, {
        method: "PATCH",
        body: { action },
      })
      notify.success(
        action === "retry" ? "Job requeued" : "Job cancelled",
        `${job.type} · ${job.id}`,
      )
      setAnnouncement(
        `${job.type} job ${action === "retry" ? "queued for retry" : "cancelled"}.`,
      )
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again."
      notify.error("Could not update job", message)
      setAnnouncement(`Could not ${action} job ${job.id}. ${message}`)
    } finally {
      setBusyId(null)
    }
  }

  async function handleEnqueue(values: {
    type: string
    payload: Record<string, unknown>
  }) {
    setEnqueueing(true)
    try {
      await apiRequest("/api/jobs", {
        method: "POST",
        body: values,
      })
      setDialogOpen(false)
      notify.success("Job enqueued", `${values.type} was added to the queue.`)
      setAnnouncement(`${values.type} job enqueued.`)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again."
      notify.error("Could not enqueue job", message)
      setAnnouncement(`Could not enqueue job. ${message}`)
    } finally {
      setEnqueueing(false)
    }
  }

  if (loading && !data) {
    return (
      <DashboardShell activeHref="/jobs" current="Jobs" accentCurrent>
        <div className="flex w-full flex-col gap-4">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-[340px] w-full rounded-lg" />
        </div>
      </DashboardShell>
    )
  }

  if (error && !data) {
    return (
      <DashboardShell activeHref="/jobs" current="Jobs" accentCurrent>
        <JobsHeader />
        <StoreErrorState
          onRetry={refresh}
          title="Couldn’t load the job queue"
          description="We couldn’t reach the jobs API. Check your connection and try again."
        />
      </DashboardShell>
    )
  }

  const jobs = data?.jobs ?? []

  return (
    <DashboardShell activeHref="/jobs" current="Jobs" accentCurrent>
      <div className="flex w-full flex-col gap-4" aria-busy={loading}>
        <JobsHeader />
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </p>
        {error ? (
          <Alert className="flex flex-col gap-3 rounded-lg border border-border bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="font-sans text-[13px] font-medium leading-normal text-foreground">
                Couldn’t refresh jobs
              </p>
              <p className="font-sans text-[12px] leading-normal text-muted-foreground">
                {error}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refresh}
              className="font-sans text-[13px] font-medium"
            >
              Retry
            </Button>
          </Alert>
        ) : null}
        <JobKpiCards {...counts} />
        <JobsFilters
          status={status}
          limit={limit}
          refreshing={refreshing}
          onStatusChange={setStatus}
          onLimitChange={setLimit}
          onRefresh={refresh}
          onEnqueue={() => setDialogOpen(true)}
        />
        <JobsTable
          jobs={jobs}
          busyId={busyId}
          filtered={status !== "all"}
          onAction={(job, action) => void handleAction(job, action)}
          onEnqueue={() => setDialogOpen(true)}
          onClearFilters={clearFilters}
        />
        <EnqueueJobDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          submitting={enqueueing}
          onSubmit={(values) => void handleEnqueue(values)}
        />
      </div>
    </DashboardShell>
  )
}
