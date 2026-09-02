import { Download, Plus } from "lucide-react"

export function LeaveHeader({
  onRequestClick,
  dateLabel,
  onExport,
}: {
  onRequestClick?: () => void
  monthLabel?: string
  dateLabel?: string
  onExport?: () => void
}) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Leave
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          {dateLabel ?? "Time-off requests, balances and coverage across all teams"}
        </p>
      </div>
      <div className="flex w-full items-center gap-2.5 sm:w-auto">
        <button
          type="button"
          onClick={onExport}
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted sm:flex-none"
        >
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} />
          <span className="hidden sm:inline font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </button>
        <button
          type="button"
          onClick={onRequestClick}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-secondary-foreground px-4 shadow-card sm:flex-none"
        >
          <Plus className="size-4 text-background" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-background">
            Request leave
          </span>
        </button>
      </div>
    </div>
  )
}
