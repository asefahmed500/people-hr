import type { ID } from "./types"

export type ReportTemplate = {
  id: ID
  title: string
  desc: string
  iconBg: string
  iconColor: string
}

export const defaultTemplates: ReportTemplate[] = [
  { id: "t-headcount", title: "Headcount report", desc: "Active, on leave, new hires and exits by department", iconBg: "bg-[#2f6f611a]", iconColor: "text-[#2f6f61]" },
  { id: "t-payroll", title: "Payroll summary", desc: "Gross, deductions, net and employer cost by team", iconBg: "bg-[#64b6ac24]", iconColor: "text-[#3e9488]" },
  { id: "t-attendance", title: "Attendance report", desc: "Present, remote, absent and lateness over time", iconBg: "bg-[#f4a26129]", iconColor: "text-[#d98842]" },
  { id: "t-engagement", title: "Engagement survey", desc: "eNPS, sentiment scores and verbatim themes", iconBg: "bg-[#3bb27326]", iconColor: "text-[#2e9160]" },
]

export type Cadence = "daily" | "weekly" | "monthly"

export type ScheduledReport = {
  id: ID
  name: string
  format: string
  cadence: Cadence
  nextRun: string
  recipients: string
  tone: "forest" | "mint" | "amber" | "slate"
  enabled: boolean
}

export const defaultScheduled: ScheduledReport[] = [
  { id: "sr-1", name: "Daily attendance digest", format: "PDF", cadence: "daily", nextRun: "Tomorrow 09:00", recipients: "People team · 4", tone: "forest", enabled: true },
  { id: "sr-2", name: "Weekly payroll pre-run", format: "CSV", cadence: "weekly", nextRun: "Fri 22 Feb", recipients: "Finance · 3", tone: "mint", enabled: true },
  { id: "sr-3", name: "Engagement pulse", format: "PDF", cadence: "weekly", nextRun: "Mon 24 Feb", recipients: "People partners · 6", tone: "slate", enabled: true },
  { id: "sr-4", name: "Monthly OKR review", format: "Slides", cadence: "monthly", nextRun: "Mar 03", recipients: "Leadership · 9", tone: "amber", enabled: false },
  { id: "sr-5", name: "Recruitment pipeline", format: "PDF", cadence: "weekly", nextRun: "Tue 25 Feb", recipients: "Hiring managers · 12", tone: "forest", enabled: true },
]

export type RecentReportRecord = {
  id: ID
  name: string
  date: string
  size: string
  status: "ready" | "generating" | "failed"
  tone: "forest" | "mint" | "amber" | "slate"
}

export const defaultRecent: RecentReportRecord[] = [
  { id: "rec-1", name: "Q4 2024 headcount.pdf", date: "12 Feb 2025", size: "1.4 MB", status: "ready", tone: "forest" },
  { id: "rec-2", name: "Jan payroll run.csv", date: "31 Jan 2025", size: "612 KB", status: "ready", tone: "mint" },
  { id: "rec-3", name: "Engagement Q1 snapshot.pdf", date: "28 Jan 2025", size: "3.2 MB", status: "generating", tone: "slate" },
  { id: "rec-4", name: "Attrition analysis.pdf", date: "21 Jan 2025", size: "—", status: "failed", tone: "amber" },
  { id: "rec-5", name: "DEI metrics 2024.pdf", date: "14 Jan 2025", size: "980 KB", status: "ready", tone: "forest" },
]

export type ReportsStore = {
  templates: ReportTemplate[]
  scheduled: ScheduledReport[]
  recent: RecentReportRecord[]
}

export const defaultReportsStore: ReportsStore = {
  templates: defaultTemplates,
  scheduled: defaultScheduled,
  recent: defaultRecent,
}
