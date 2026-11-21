import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requirePageRole } from "@/lib/auth-guards"
import { ActivityPageClient } from "./activity-page-client"

export default async function ActivityPage() {
  await requirePageRole()
  return (
    <DashboardShell activeHref="/activity" current="Activity">
      <ActivityPageClient />
    </DashboardShell>
  )
}
