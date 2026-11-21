import { Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const JOB_STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "dead", label: "Dead" },
]

export const JOB_LIMIT_OPTIONS = [25, 50, 100, 200]

type JobsFiltersProps = {
  status: string
  limit: string
  refreshing: boolean
  onStatusChange: (value: string) => void
  onLimitChange: (value: string) => void
  onRefresh: () => void
  onEnqueue: () => void
}

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3 font-sans text-[13px] leading-normal text-foreground outline-none focus:border-primary"

export function JobsFilters({
  status,
  limit,
  refreshing,
  onStatusChange,
  onLimitChange,
  onRefresh,
  onEnqueue,
}: JobsFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
        <label className="flex w-full flex-col gap-1.5 sm:w-[160px]">
          <span className="font-sans text-xs font-medium leading-normal text-muted-foreground">
            Status
          </span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter jobs by status"
            className={selectClass}
          >
            {JOB_STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full flex-col gap-1.5 sm:w-[110px]">
          <span className="font-sans text-xs font-medium leading-normal text-muted-foreground">
            Limit
          </span>
          <select
            value={limit}
            onChange={(event) => onLimitChange(event.target.value)}
            aria-label="Number of jobs to show"
            className={selectClass}
          >
            {JOB_LIMIT_OPTIONS.map((value) => (
              <option key={value} value={String(value)}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh job list"
          className="font-sans text-[13px] font-medium"
        >
          <RefreshCw
            className={cn("size-4", refreshing && "animate-spin")}
            strokeWidth={2}
            aria-hidden="true"
          />
          Refresh
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onEnqueue}
          aria-label="Enqueue a job"
          className="font-sans text-[13px] font-medium"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          Enqueue job
        </Button>
      </div>
    </div>
  )
}
