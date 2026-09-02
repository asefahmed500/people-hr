import * as React from "react"
import { Clock, Download, Ellipsis } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ScheduledReport } from "@/lib/data"
import { Switch } from "@/components/ui/switch"

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
    <div className="flex flex-1 flex-col overflow-clip rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-b-border px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Scheduled reports
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            {active} of {items.length} report{items.length !== 1 ? "s" : ""} active
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="px-6 py-10 text-center font-sans text-[12.5px] text-muted-foreground">
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
        "relative flex items-center gap-4 px-6 py-3.5",
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
          {report.format} · {report.recipients}
        </span>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold uppercase leading-normal tracking-[0.4px]",
          cadence.bg,
          cadence.text,
        )}
      >
        <Clock className="size-3" strokeWidth={2} />
        {report.cadence}
      </span>
      <span className="w-28 shrink-0 text-right font-sans text-[12.5px] leading-normal text-muted-foreground">
        {report.nextRun}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <Switch
          aria-label={`Toggle ${report.name}`}
          checked={report.enabled}
          onCheckedChange={(v) => onToggleEnabled?.(report.id, v)}
        />
        <div className="relative">
          <button
            type="button"
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
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <Ellipsis className="size-4" strokeWidth={2} />
          </button>
          {open && (
            <div
              role="menu"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false)
              }}
              className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-border bg-card py-1 shadow-lg"
            >
              <button
                type="button"
                onClick={() => { setOpen(false); onGenerateNow?.(report) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-secondary-foreground hover:bg-muted"
              >
                <Download className="size-3.5" strokeWidth={2} />
                Generate now
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(report.id, report.name, "edit") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-secondary-foreground hover:bg-muted"
              >
                Edit
              </button>
              <div className="mx-2 my-1 h-px bg-border" />
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
