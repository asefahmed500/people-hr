import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { GoalsHeader } from "@/components/goals/goals-header"
import { GoalsKpiStrip } from "@/components/goals/goals-kpi-strip"
import { ObjectivesGrid } from "@/components/goals/objectives-grid"

export default function GoalsPage() {
  return (
    <DashboardShell activeHref="/goals" current="Goals" accentCurrent>
      <GoalsHeader />
      <GoalsKpiStrip />
      <ObjectivesGrid />
    </DashboardShell>
  )
}
