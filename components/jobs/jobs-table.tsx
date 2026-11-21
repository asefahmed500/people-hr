import { Loader2, RotateCcw, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { JobTypeBadge, StatusPill } from "./job-badges"
import { JobsEmptyState } from "./jobs-empty-state"
import { formatDateTime, payloadSummary, type Job } from "./types"

type JobAction = "retry" | "cancel"

type JobsTableProps = {
  jobs: Job[]
  busyId: string | null
  filtered: boolean
  onAction: (job: Job, action: JobAction) => void
  onEnqueue: () => void
  onClearFilters: () => void
}

export function JobsTable({
  jobs,
  busyId,
  filtered,
  onAction,
  onEnqueue,
  onClearFilters,
}: JobsTableProps) {
  return (
    <section className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-h4">Job queue</h2>
          <p className="font-sans text-[12px] leading-normal text-muted-foreground">
            {jobs.length} job{jobs.length === 1 ? "" : "s"} shown
          </p>
        </div>
        <span className="font-sans text-[11px] leading-normal text-muted-foreground">
          Most recent first
        </span>
      </div>
      {jobs.length === 0 ? (
        <JobsEmptyState
          filtered={filtered}
          onEnqueue={onEnqueue}
          onClearFilters={onClearFilters}
        />
      ) : (
        <Table className="min-w-[860px]">
          <TableCaption className="sr-only">
            Background jobs in the queue
          </TableCaption>
          <TableHeader className="[&_th]:font-semibold">
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="pl-5">Job</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Next run</TableHead>
              <TableHead>Last error</TableHead>
              <TableHead className="pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                busy={busyId === job.id}
                onAction={onAction}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}

function JobRow({
  job,
  busy,
  onAction,
}: {
  job: Job
  busy: boolean
  onAction: (job: Job, action: JobAction) => void
}) {
  const summary = payloadSummary(job.payload)
  const canRetry = job.status === "failed" || job.status === "dead"
  const canCancel = job.status === "queued" || job.status === "running"

  return (
    <TableRow aria-busy={busy}>
      <TableCell className="pl-5">
        <div className="flex flex-col gap-1">
          <JobTypeBadge type={job.type} />
          <span
            className="block max-w-[220px] truncate font-mono text-[10.5px] leading-normal text-muted-foreground"
            title={job.id}
          >
            {job.id}
          </span>
          {summary ? (
            <span
              className="block max-w-[220px] truncate font-sans text-[10.5px] leading-normal text-muted-foreground"
              title={summary}
            >
              {summary}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <StatusPill status={job.status} />
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "font-sans text-[12.5px] font-medium leading-normal",
            job.attempts >= job.maxAttempts && job.status !== "succeeded"
              ? "text-foreground"
              : "text-secondary-foreground",
          )}
        >
          {job.attempts} / {job.maxAttempts}
        </span>
      </TableCell>
      <TableCell className="font-sans text-[12px] leading-normal text-muted-foreground">
        {formatDateTime(job.createdAt)}
      </TableCell>
      <TableCell className="font-sans text-[12px] leading-normal text-muted-foreground">
        {formatDateTime(job.runAfter)}
      </TableCell>
      <TableCell className="max-w-[220px]">
        {job.lastError ? (
          <span
            className="block max-w-[220px] truncate font-sans text-[12px] leading-normal text-destructive"
            title={job.lastError}
          >
            {job.lastError}
          </span>
        ) : (
          <span className="font-sans text-[12px] text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="pr-5">
        <div className="flex items-center justify-end gap-1.5">
          {canRetry ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onAction(job, "retry")}
              aria-label={`Retry ${job.type} job ${job.id}`}
              className="font-sans text-[12px] font-medium"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden="true" />
              )}
              Retry
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onAction(job, "cancel")}
              aria-label={`Cancel ${job.type} job ${job.id}`}
              className="font-sans text-[12px] font-medium text-muted-foreground"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="size-3.5" strokeWidth={2} aria-hidden="true" />
              )}
              Cancel
            </Button>
          ) : null}
          {!canRetry && !canCancel ? (
            <span className="font-sans text-[12px] text-muted-foreground">—</span>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}
