import { ChevronRight, Download } from "lucide-react"

import { cn } from "@/lib/utils"

type Status = "ready" | "generating" | "failed"

type Report = {
  name: string
  date: string
  size: string
  status: Status
  tone: "forest" | "mint" | "amber" | "slate"
}

const toneDot: Record<Report["tone"], string> = {
  forest: "bg-[#2f6f61]",
  mint: "bg-[#64b6ac]",
  amber: "bg-[#d98a2b]",
  slate: "bg-[#64748b]",
}

const statusStyles: Record<Status, { bg: string; text: string; label: string }> = {
  ready: { bg: "bg-[#3bb27326]", text: "text-[#2e9160]", label: "Ready" },
  generating: { bg: "bg-[#d98a2b1a]", text: "text-[#b26a1f]", label: "Generating" },
  failed: { bg: "bg-[#e76f511a]", text: "text-[#c4553a]", label: "Failed" },
}

const reports: Report[] = [
  {
    name: "Q4 2024 headcount.pdf",
    date: "12 Feb 2025",
    size: "1.4 MB",
    status: "ready",
    tone: "forest",
  },
  {
    name: "Jan payroll run.csv",
    date: "31 Jan 2025",
    size: "612 KB",
    status: "ready",
    tone: "mint",
  },
  {
    name: "Engagement Q1 snapshot.pdf",
    date: "28 Jan 2025",
    size: "3.2 MB",
    status: "generating",
    tone: "slate",
  },
  {
    name: "Attrition analysis.pdf",
    date: "21 Jan 2025",
    size: "—",
    status: "failed",
    tone: "amber",
  },
  {
    name: "DEI metrics 2024.pdf",
    date: "14 Jan 2025",
    size: "980 KB",
    status: "ready",
    tone: "forest",
  },
]

export function RecentReports() {
  return (
    <div className="flex w-[420px] shrink-0 flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-5 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display inline-block text-[15px] font-semibold leading-tight text-[#1f2a26]">
            Recent exports
          </h2>
          <span className="font-sans inline-block text-[12px] leading-normal text-[#8a948d]">
            Last 30 days
          </span>
        </div>
        <button type="button" className="flex items-center gap-1">
          <span className="font-sans inline-block text-[12px] font-semibold leading-normal text-[#2f6f61]">
            All
          </span>
          <ChevronRight className="size-3.5 text-[#2f6f61]" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {reports.map((report) => (
          <ReportRow key={report.name} report={report} />
        ))}
      </div>
    </div>
  )
}

function ReportRow({ report }: { report: Report }) {
  const s = statusStyles[report.status]
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#f1eee8] bg-[#faf9f6] p-3">
      <span className={`size-2.5 shrink-0 rounded-full ${toneDot[report.tone]}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-sans inline-block overflow-clip text-[12.5px] font-semibold leading-tight text-[#1f2a26] [text-overflow:ellipsis]">
          {report.name}
        </span>
        <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
          {report.date} · {report.size}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold leading-normal",
          s.bg,
          s.text,
        )}
      >
        {s.label}
      </span>
      <button
        type="button"
        aria-label={`Download ${report.name}`}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#8a948d] hover:bg-white"
      >
        <Download className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  )
}
