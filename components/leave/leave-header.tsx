import { Download, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

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
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className="h-9 px-4 sm:flex-none"
        >
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="hidden sm:inline font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </Button>
        <Button
          type="button"
          onClick={onRequestClick}
          className="h-9 flex-1 px-4 sm:flex-none"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans text-[13px] font-medium leading-normal">
            Request leave
          </span>
        </Button>
      </div>
    </div>
  )
}
