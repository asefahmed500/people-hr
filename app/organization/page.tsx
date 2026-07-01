import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { OrgHeader } from "@/components/organization/org-header"
import { OrgStatRow } from "@/components/organization/org-stat-row"
import { OrgChartCard } from "@/components/organization/org-chart-card"
import { DepartmentsSection } from "@/components/organization/departments-section"
import { OfficesCard } from "@/components/organization/offices-card"

export default function OrganizationPage() {
  return (
    <DashboardShell activeHref="/organization" current="Organization" accentCurrent>
      <OrgHeader />
      <OrgStatRow />
      <OrgChartCard />
      <DepartmentsSection />
      <OfficesCard />
    </DashboardShell>
  )
}
