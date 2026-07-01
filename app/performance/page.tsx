import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PerformanceHeader } from "@/components/performance/performance-header"
import { RatingDistribution } from "@/components/performance/rating-distribution"
import { DepartmentFilterBar } from "@/components/performance/department-filter-bar"
import { PerformanceSpotlight } from "@/components/performance/performance-spotlight"
import { TeamLeaderboard } from "@/components/performance/team-leaderboard"
import { EmployeePerformance } from "@/components/performance/employee-performance"

export default function PerformancePage() {
  return (
    <DashboardShell activeHref="/performance" current="Performance" accentCurrent>
      <PerformanceHeader />
      <RatingDistribution />
      <DepartmentFilterBar />
      <PerformanceSpotlight />
      <TeamLeaderboard />
      <EmployeePerformance />
    </DashboardShell>
  )
}
