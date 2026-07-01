import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { GreetingBanner } from "@/components/dashboard/greeting-banner"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { HeadcountChart } from "@/components/dashboard/headcount-chart"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { AttendanceCard } from "@/components/dashboard/attendance-card"
import { LeaveRequests } from "@/components/dashboard/leave-requests"
import { RecentHires } from "@/components/dashboard/recent-hires"
import { RecruitmentPipeline } from "@/components/dashboard/recruitment-pipeline"

export default function Page() {
  return (
    <DashboardShell activeHref="/" current="Dashboard">
      <GreetingBanner />
      <KpiRow />
      <div className="flex h-[392px] w-full shrink-0 gap-6">
        <HeadcountChart />
        <InsightsPanel />
      </div>
      <div className="flex h-fit w-full gap-6">
        <AttendanceCard />
        <LeaveRequests />
        <RecentHires />
      </div>
      <RecruitmentPipeline />
    </DashboardShell>
  )
}
