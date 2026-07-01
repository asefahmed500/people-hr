import { ChevronRight, Clock, Ellipsis } from "lucide-react"

import { cn } from "@/lib/utils"

type Cadence = "daily" | "weekly" | "monthly"

type Report = {
  name: string
  format: string
  cadence: Cadence
  nextRun: string
  recipients: string
  tone: "forest" | "mint" | "amber" | "slate"
}

const toneDot: Record<Report["tone"], string> = {
  forest: "bg-[#2f6f61]",
  mint: "bg-[#64b6ac]",
  amber: "bg-[#d98a2b]",
  slate: "bg-[#64748b]",
}

const cadenceStyles: Record<Cadence, { bg: string; text: string }> = {
  daily: { bg: "bg-[#2f6f611a]", text: "text-[#2f6f61]" },
  weekly: { bg: "bg-[#64b6ac1f]", text: "text-[#3e9488]" },
  monthly: { bg: "bg-[#d98a2b1a]", text: "text-[#b26a1f]" },
}

const reports: Report[] = [
  {
    name: "Daily attendance digest",
    format: "PDF",
    cadence: "daily",
    nextRun: "Tomorrow 09:00",
    recipients: "People team · 4",
    tone: "forest",
  },
  {
    name: "Weekly payroll pre-run",
    format: "CSV",
    cadence: "weekly",
    nextRun: "Fri 22 Feb",
    recipients: "Finance · 3",
    tone: "mint",
  },
  {
    name: "Engagement pulse",
    format: "PDF",
    cadence: "weekly",
    nextRun: "Mon 24 Feb",
    recipients: "People partners · 6",
    tone: "slate",
  },
  {
    name: "Monthly OKR review",
    format: "Slides",
    cadence: "monthly",
    nextRun: "Mar 03",
    recipients: "Leadership · 9",
    tone: "amber",
  },
  {
    name: "Recruitment pipeline",
    format: "PDF",
    cadence: "weekly",
    nextRun: "Tue 25 Feb",
    recipients: "Hiring managers · 12",
    tone: "forest",
  },
]

export function ScheduledReports() {
  return (
    <div className="flex flex-1 flex-col overflow-clip rounded-[18px] border border-[#edeae3] bg-white shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between border-b border-b-[#edeae3] px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
            Scheduled reports
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            12 reports running across the workspace
          </span>
        </div>
        <button type="button" className="flex items-center gap-1">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#2f6f61]">
            Manage
          </span>
          <ChevronRight className="size-3.5 text-[#2f6f61]" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col">
        {reports.map((report, idx) => (
          <ReportRow key={report.name} report={report} last={idx === reports.length - 1} />
        ))}
      </div>
    </div>
  )
}

function ReportRow({ report, last }: { report: Report; last: boolean }) {
  const cadence = cadenceStyles[report.cadence]
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-6 py-3.5",
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
      <button
        type="button"
        aria-label={`More options for ${report.name}`}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#b0b7af] hover:bg-[#faf9f6]"
      >
        <Ellipsis className="size-4" strokeWidth={2} />
      </button>
    </div>
  )
}
