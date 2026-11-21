import type { ID } from "./types"

export type ReportTemplate = {
  id: ID
  title: string
  desc: string
  iconBg: string
  iconColor: string
}

// Static product catalog of report types (not user data).
export const defaultTemplates: ReportTemplate[] = [
  { id: "t-headcount", title: "Headcount report", desc: "Active, on leave, new hires and exits by department", iconBg: "bg-foreground/10", iconColor: "text-primary" },
  { id: "t-payroll", title: "Payroll summary", desc: "Gross, deductions, net and employer cost by team", iconBg: "bg-foreground/10", iconColor: "text-secondary-foreground" },
  { id: "t-attendance", title: "Attendance report", desc: "Present, remote, absent and lateness over time", iconBg: "bg-foreground/10", iconColor: "text-secondary-foreground" },
  { id: "t-engagement", title: "Engagement survey", desc: "eNPS, sentiment scores and verbatim themes", iconBg: "bg-foreground/10", iconColor: "text-secondary-foreground" },
]

export type Cadence = "daily" | "weekly" | "monthly"

export type ScheduledReport = {
  id: ID
  name: string
  type: string
  format: string
  cadence: Cadence
  nextRun: string
  recipients: string
  tone: "forest" | "mint" | "amber" | "slate"
  enabled: boolean
}

export type RecentReportRecord = {
  id: ID
  name: string
  date: string
  size: string
  status: "ready" | "generating" | "failed"
  tone: "forest" | "mint" | "amber" | "slate"
  /** Store key used to build this export, so re-downloads match the original. */
  reportType?: string
}

export type ReportsStore = {
  templates: ReportTemplate[]
  scheduled: ScheduledReport[]
  recent: RecentReportRecord[]
}

export const defaultReportsStore: ReportsStore = {
  templates: defaultTemplates,
  scheduled: [],
  recent: [],
}
