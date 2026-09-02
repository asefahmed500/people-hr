import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requirePageRole } from "@/lib/auth-guards"
import { EmployeesPageClient } from "./employees-page-client"

export default async function EmployeesPage() {
  await requirePageRole("admin", "manager")
  return (
    <DashboardShell activeHref="/employees" current="Employees" accentCurrent>
      <EmployeesPageClient />
    </DashboardShell>
  )
}
