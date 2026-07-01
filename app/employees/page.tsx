import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DirectoryHeader } from "@/components/employees/directory-header"
import { DirectoryStatChips } from "@/components/employees/directory-stat-chips"
import { DirectoryTable } from "@/components/employees/directory-table"

export default function EmployeesPage() {
  return (
    <DashboardShell activeHref="/employees" current="Employees" accentCurrent>
      <DirectoryHeader />
      <DirectoryStatChips />
      <DirectoryTable />
    </DashboardShell>
  )
}
