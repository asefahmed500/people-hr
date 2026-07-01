import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportTemplates } from "@/components/reports/report-templates"
import { ScheduledReports } from "@/components/reports/scheduled-reports"
import { RecentReports } from "@/components/reports/recent-reports"

export default function ReportsPage() {
  return (
    <DashboardShell activeHref="/reports" current="Reports" accentCurrent>
      <ReportsHeader />
      <ReportTemplates />
      <div className="flex items-start gap-5">
        <ScheduledReports />
        <RecentReports />
      </div>
    </DashboardShell>
  )
}
