import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { LeavePageClient } from "./leave-page-client"

export default function LeavePage() {
  return (
    <DashboardShell activeHref="/leave" current="Leave" accentCurrent>
      <LeavePageClient />
    </DashboardShell>
  )
}
