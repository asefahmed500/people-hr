import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardPageClient } from "./dashboard-page-client"

export default function Page() {
  return (
    <DashboardShell activeHref="/" current="Dashboard">
      <DashboardPageClient />
    </DashboardShell>
  )
}
