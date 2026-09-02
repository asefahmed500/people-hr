import { Calendar, Download } from "lucide-react"

type AnalyticsHeaderProps = {
  onExport?: () => void
}

export function AnalyticsHeader({ onExport }: AnalyticsHeaderProps) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">
          Analytics
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-muted-foreground">
          Workforce metrics and trends · Trailing 12 months
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Calendar className="size-3.5 text-muted-foreground" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Trailing 12 months
          </span>
        </span>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Download className="size-3.5 text-secondary-foreground" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </button>
      </div>
    </div>
  )
}
