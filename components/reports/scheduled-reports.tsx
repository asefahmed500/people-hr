import * as React from "react"
import { Clock, Download, Ellipsis } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ScheduledReport } from "@/lib/data"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const toneDot: Record<ScheduledReport["tone"], string> = {
  forest: "bg-primary",
  mint: "bg-secondary-foreground",
  amber: "bg-secondary-foreground",
  slate: "bg-secondary-foreground",
}

const cadenceStyles: Record<ScheduledReport["cadence"], { bg: string; text: string }> = {
  daily: { bg: "bg-foreground/10", text: "text-primary" },
  weekly: { bg: "bg-foreground/10", text: "text-secondary-foreground" },
  monthly: { bg: "bg-foreground/10", text: "text-secondary-foreground" },
}

type ScheduledReportsProps = {
  onReportAction?: (id: string, name: string, action: string) => void
  onToggleEnabled?: (id: string, enabled: boolean) => void
  onGenerateNow?: (report: ScheduledReport) => void
  scheduled?: ScheduledReport[]
}

export function ScheduledReports({
  onReportAction,
  onToggleEnabled,
  onGenerateNow,
  scheduled,
}: ScheduledReportsProps) {
  const items = scheduled ?? []
  const active = items.filter((r) => r.enabled).length
  return (
    <div className="flex flex-1 flex-col overflow-clip rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-b-border px-4 py-3 sm:px-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Scheduled reports
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            {active} of {items.length} report{items.length !== 1 ? "s" : ""} active
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
            Generated in-app on schedule (about every 10 minutes). Each run appears under Recent
            exports with a notification — no emails are sent.
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center font-sans text-[12.5px] text-muted-foreground">
          No scheduled reports yet.
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((report, idx) => (
            <ReportRow
              key={report.id}
              report={report}
              last={idx === items.length - 1}
              onAction={onReportAction}
              onToggleEnabled={onToggleEnabled}
              onGenerateNow={onGenerateNow}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReportRow({
  report,
  last,
  onAction,
  onToggleEnabled,
  onGenerateNow,
}: {
  report: ScheduledReport
  last: boolean
  onAction?: (id: string, name: string, action: string) => void
  onToggleEnabled?: (id: string, enabled: boolean) => void
  onGenerateNow?: (report: ScheduledReport) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const cadence = cadenceStyles[report.cadence]

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center gap-2 px-4 py-3 sm:gap-3 sm:px-4",
        !last && "border-b border-b-border",
        !report.enabled && "opacity-55",
      )}
    >
      <span className={`size-2.5 shrink-0 rounded-full ${toneDot[report.tone]}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-sans inline-block overflow-clip text-[13.5px] font-semibold leading-tight text-foreground [text-overflow:ellipsis]">
          {report.name}
        </span>
        <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
          {report.format} · Audience: {report.recipients}
        </span>
      </div>
      <Badge
        variant="secondary"
        className={cn(
          "hidden h-6 gap-1 text-[10px] uppercase tracking-[0.4px] sm:inline-flex",
          cadence.bg,
          cadence.text,
        )}
      >
        <Clock className="size-3" strokeWidth={2} aria-hidden="true" />
        {report.cadence}
      </Badge>
      <span className="hidden w-28 shrink-0 text-right font-sans text-[12.5px] leading-normal text-muted-foreground md:block">
        {report.nextRun}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <Switch
          aria-label={`Toggle ${report.name}`}
          checked={report.enabled}
          onCheckedChange={(v) => onToggleEnabled?.(report.id, v)}
        />
        <div className="relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More options for ${report.name}`}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && open) {
                      e.stopPropagation()
                      setOpen(false)
                    }
                  }}
                >
                  <Ellipsis className="size-4" strokeWidth={2} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>More options</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {open && (
            <div
              role="menu"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false)
              }}
              className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-card py-1"
            >
              <button
                type="button"
                onClick={() => { setOpen(false); onGenerateNow?.(report) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-secondary-foreground hover:bg-muted"
              >
                <Download className="size-3.5" strokeWidth={2} aria-hidden="true" />
                Generate now
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(report.id, report.name, "edit") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-secondary-foreground hover:bg-muted"
              >
                Edit
              </button>
              <Separator className="mx-2 my-1 w-auto" />
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(report.id, report.name, "delete") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-foreground hover:bg-muted"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
