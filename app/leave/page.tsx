import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { LeaveHeader } from "@/components/leave/leave-header"
import { LeaveKpiStrip } from "@/components/leave/leave-kpi-strip"
import { LeaveCalendar } from "@/components/leave/leave-calendar"
import { PendingRequests } from "@/components/leave/pending-requests"
import { BalanceByType } from "@/components/leave/balance-by-type"

export default function LeavePage() {
  return (
    <DashboardShell activeHref="/leave" current="Leave" accentCurrent>
      <LeaveHeader />
      <LeaveKpiStrip />
      <div className="flex min-h-[640px] flex-1 items-start gap-5">
        <LeaveCalendar />
        <div className="flex w-[360px] shrink-0 flex-col gap-5">
          <PendingRequests />
          <BalanceByType />
        </div>
      </div>
    </DashboardShell>
  )
}
