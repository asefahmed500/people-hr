import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardPageClient } from "@/app/dashboard-page-client"

export default function Page() {
  return (
    <DashboardShell activeHref="/dashboard" current="Dashboard">
      <DashboardPageClient />
    </DashboardShell>
  )
}
