import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AnalyticsHeader } from "@/components/analytics/analytics-header"
import { AnalyticsKpiStrip } from "@/components/analytics/analytics-kpi-strip"
import { WorkforceTrendCard } from "@/components/analytics/workforce-trend-card"
import { WorkforceBreakdown } from "@/components/analytics/workforce-breakdown"

export default function AnalyticsPage() {
  return (
    <DashboardShell activeHref="/analytics" current="Analytics" accentCurrent>
      <AnalyticsHeader />
      <AnalyticsKpiStrip />
      <div className="flex items-start gap-5">
        <WorkforceTrendCard />
        <WorkforceBreakdown />
      </div>
    </DashboardShell>
  )
}
