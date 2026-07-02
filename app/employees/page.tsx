import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { EmployeesPageClient } from "./employees-page-client"

export default function EmployeesPage() {
  return (
    <DashboardShell activeHref="/employees" current="Employees" accentCurrent>
      <EmployeesPageClient />
    </DashboardShell>
  )
}
