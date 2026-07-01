import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AttendanceHeader } from "@/components/attendance/attendance-header"
import { TodayStatusCard } from "@/components/attendance/today-status-card"
import { AttendanceKpis } from "@/components/attendance/attendance-kpis"
import { DeptHeatCard } from "@/components/attendance/dept-heat-card"
import { LiveCheckins } from "@/components/attendance/live-checkins"

export default function AttendancePage() {
  return (
    <DashboardShell activeHref="/attendance" current="Attendance" accentCurrent>
      <AttendanceHeader />
      <div className="flex w-full items-start gap-6">
        <TodayStatusCard />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <AttendanceKpis />
          <DeptHeatCard />
        </div>
      </div>
      <LiveCheckins />
    </DashboardShell>
  )
}
