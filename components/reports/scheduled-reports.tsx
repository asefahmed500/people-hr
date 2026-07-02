import * as React from "react"
import { ChevronRight, Clock, Ellipsis } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ScheduledReport } from "@/lib/data"

const toneDot: Record<ScheduledReport["tone"], string> = {
  forest: "bg-[#2f6f61]",
  mint: "bg-[#64b6ac]",
  amber: "bg-[#d98a2b]",
  slate: "bg-[#64748b]",
}

const cadenceStyles: Record<ScheduledReport["cadence"], { bg: string; text: string }> = {
  daily: { bg: "bg-[#2f6f611a]", text: "text-[#2f6f61]" },
  weekly: { bg: "bg-[#64b6ac1f]", text: "text-[#3e9488]" },
  monthly: { bg: "bg-[#d98a2b1a]", text: "text-[#b26a1f]" },
}

type ScheduledReportsProps = {
  onManage?: () => void
  onReportAction?: (id: string, name: string, action: string) => void
  scheduled?: ScheduledReport[]
}

export function ScheduledReports({ onManage, onReportAction, scheduled }: ScheduledReportsProps) {
  const items = scheduled ?? []
  return (
    <div className="flex flex-1 flex-col overflow-clip rounded-[18px] border border-[#edeae3] bg-white shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between border-b border-b-[#edeae3] px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
            Scheduled reports
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            {items.length} report{items.length !== 1 ? "s" : ""} running across the workspace
          </span>
        </div>
        <button type="button" onClick={onManage} className="flex items-center gap-1">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#2f6f61]">
            Manage
          </span>
          <ChevronRight className="size-3.5 text-[#2f6f61]" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col">
        {items.map((report, idx) => (
          <ReportRow key={report.id} report={report} last={idx === items.length - 1} onAction={onReportAction} />
        ))}
      </div>
    </div>
  )
}

function ReportRow({ report, last, onAction }: { report: ScheduledReport; last: boolean; onAction?: (id: string, name: string, action: string) => void }) {
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
        !last && "border-b border-b-[#f1eee8]",
      )}
    >
      <span className={`size-2.5 shrink-0 rounded-full ${toneDot[report.tone]}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-sans inline-block overflow-clip text-[13.5px] font-semibold leading-tight text-[#1f2a26] [text-overflow:ellipsis]">
          {report.name}
        </span>
        <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
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
      <span className="w-28 shrink-0 text-right font-sans text-[12.5px] leading-normal text-[#8a948d]">
        {report.nextRun}
      </span>
      <div className="relative">
        <button
          type="button"
          aria-label={`More options for ${report.name}`}
          onClick={() => setOpen((v) => !v)}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#b0b7af] hover:bg-[#faf9f6]"
        >
          <Ellipsis className="size-4" strokeWidth={2} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-[#edeae3] bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => { setOpen(false); onAction?.(report.id, report.name, "edit") }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-[#42504a] hover:bg-[#faf9f6]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onAction?.(report.id, report.name, "delete") }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-[#c4553a] hover:bg-[#faf9f6]"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
