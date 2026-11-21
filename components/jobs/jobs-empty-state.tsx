import { Inbox, Plus, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

type JobsEmptyStateProps = {
  filtered: boolean
  onEnqueue: () => void
  onClearFilters: () => void
}

export function JobsEmptyState({
  filtered,
  onEnqueue,
  onClearFilters,
}: JobsEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted px-4 py-10 text-center">
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Inbox className="size-6" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-h4">
          {filtered ? "No matching jobs" : "The queue is clear"}
        </h3>
        <p className="max-w-sm font-sans text-[13px] leading-relaxed text-muted-foreground">
          {filtered
            ? "No jobs match the current status filter. Try another status or a larger limit."
            : "Background jobs will appear here as the workspace schedules work. You can also enqueue one manually."}
        </p>
      </div>
      {filtered ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="font-sans text-[13px] font-medium"
        >
          <RotateCcw className="size-4" strokeWidth={2} aria-hidden="true" />
          Clear filters
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={onEnqueue}
          className="font-sans text-[13px] font-medium"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          Enqueue job
        </Button>
      )}
    </div>
  )
}
