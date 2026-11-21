import { Download } from "lucide-react"

import { cn } from "@/lib/utils"
import type { RecentReportRecord } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const toneDot: Record<RecentReportRecord["tone"], string> = {
  forest: "bg-primary",
  mint: "bg-secondary-foreground",
  amber: "bg-secondary-foreground",
  slate: "bg-secondary-foreground",
}

const statusStyles: Record<RecentReportRecord["status"], { bg: string; text: string; label: string }> = {
  ready: { bg: "bg-foreground/10", text: "text-secondary-foreground", label: "Ready" },
  generating: { bg: "bg-foreground/10", text: "text-secondary-foreground", label: "Generating" },
  failed: { bg: "bg-foreground/10", text: "text-foreground", label: "Failed" },
}

type RecentReportsProps = {
  onDownload?: (name: string, reportType?: string) => void
  recent?: RecentReportRecord[]
}

export function RecentReports({ onDownload, recent }: RecentReportsProps) {
  const items = recent ?? []
  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4 lg:w-[420px] lg:shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-h4">
            Recent exports
          </h2>
          <span className="font-sans inline-block text-[12px] leading-normal text-muted-foreground">
            {items.length} report{items.length !== 1 ? "s" : ""} in the last 30 days
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-[12px] text-muted-foreground">
          No exports yet — generate a report to see it here.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((report) => (
            <ReportRow key={report.id} report={report} onDownload={onDownload} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReportRow({ report, onDownload }: { report: RecentReportRecord; onDownload?: (name: string, reportType?: string) => void }) {
  const s = statusStyles[report.status]
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
      <span className={`size-2.5 shrink-0 rounded-full ${toneDot[report.tone]}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-sans inline-block overflow-clip text-[12.5px] font-semibold leading-tight text-foreground [text-overflow:ellipsis]">
          {report.name}
        </span>
        <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
          {report.date} · {report.size}
        </span>
      </div>
      <Badge
        variant="secondary"
        className={cn("h-5 text-[10px]", s.bg, s.text)}
      >
        {s.label}
      </Badge>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Download ${report.name}`}
              onClick={() => onDownload?.(report.name, report.reportType)}
            >
              <Download className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download report</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
