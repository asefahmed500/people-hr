"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

import {
  type LeaveRequest,
  type LeaveStore,
  defaultLeaveStore,
  adjustBalance,
  type Employee,
  defaultEmployees,
  type RecruitmentStore,
  defaultRecruitmentStore,
  type AttendanceStore,
  defaultCheckIns,
  type ProjectsStore,
  defaultProjectsStore,
  type OrganizationStore,
  defaultOrganizationStore,
} from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { notify } from "@/lib/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { GreetingBanner } from "@/components/dashboard/greeting-banner"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { HeadcountChart } from "@/components/dashboard/headcount-chart"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { AttendanceCard } from "@/components/dashboard/attendance-card"
import { RecentHires } from "@/components/dashboard/recent-hires"
import { RecruitmentPipeline } from "@/components/dashboard/recruitment-pipeline"

export function DashboardPageClient() {
  const router = useRouter()
  const { user } = useAuth()
  const todayISO = toISO(new Date())

  const { state: leaveStore, setState: setLeaveStore, hydrated: leaveHydrated } = useApiStore<LeaveStore>(
    "/api/store/leave",
    () => defaultLeaveStore,
  )

  const { state: employees, setState: setEmployees, hydrated: employeesHydrated } = useApiStore<Employee[]>(
    "/api/store/employees",
    () => defaultEmployees,
  )

  const { state: recruitment, hydrated: recruitmentHydrated } = useApiStore<RecruitmentStore>(
    "/api/store/recruitment",
    () => defaultRecruitmentStore,
  )

  const { state: attendance, hydrated: attendanceHydrated } = useApiStore<AttendanceStore>(
    "/api/store/attendance",
    () => ({ checkIns: defaultCheckIns }),
  )

  const { state: projects, hydrated: projectsHydrated } = useApiStore<ProjectsStore>(
    "/api/store/projects",
    () => defaultProjectsStore,
  )

  const { state: organization, hydrated: organizationHydrated } = useApiStore<OrganizationStore>(
    "/api/store/organization",
    () => defaultOrganizationStore,
  )

  const hydrated =
    leaveHydrated && employeesHydrated && recruitmentHydrated && attendanceHydrated && projectsHydrated && organizationHydrated

  const canManageLeave = user?.role === "admin" || user?.role === "manager"

  const pending = leaveStore.requests.filter((r) => r.status === "pending")

  const onApprove = (id: string) => {
    const req = leaveStore.requests.find((r) => r.id === id)
    if (!req || req.status !== "pending") return
    setLeaveStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status: "approved" } : r,
      ),
      balances: adjustBalance(prev.balances, req, req.days),
    }))
    // Only mark "on leave" when the approved window actually covers today —
    // never permanently.
    if (todayISO >= req.startDate && todayISO <= req.endDate) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === req.employeeId ? { ...e, status: "leave" as const } : e)),
      )
    }
    notify.success("Leave approved", `Approved ${req.employeeName}'s ${req.days}-day request.`)

  }

  const onDecline = (id: string) => {
    const req = leaveStore.requests.find((r) => r.id === id)
    if (!req || req.status !== "pending") return
    setLeaveStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status: "declined" } : r,
      ),
    }))
    notify.info("Leave declined", `Declined ${req.employeeName}'s request.`)

  }

  const onViewAllHires = () => router.push("/employees")
  const onOpenBoard = () => router.push("/recruitment")
  const onOpenAssistant = () => router.push("/assistant")

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <GreetingBanner
        employeeCount={canManageLeave ? employees.length : undefined}
        pendingLeave={pending.length}
        // Department counts come from the organization module, which is
        // admin-only — managers would otherwise render "0 departments".
        departmentCount={user?.role === "admin" ? organization.departments.length : undefined}
      />
      <KpiRow
        employees={employees}
        attendance={attendance}
        pendingLeave={pending.length}
        openRoles={recruitment.openings.length}
        interviews={recruitment.candidates.filter((c) => c.stage === "interview").length}
      />
      <div className="flex w-full flex-col gap-6 xl:h-[392px] xl:flex-row">
        <HeadcountChart employees={employees} />
        <InsightsPanel
          onOpenAssistant={onOpenAssistant}
          employees={employees}
          projects={projects.tasks}
          candidates={recruitment.candidates}
        />
      </div>
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
        <AttendanceCard attendance={attendance} employees={employees} />
        <LeaveRequestsCard
          pending={pending}
          onApprove={onApprove}
          onDecline={onDecline}
          canManage={canManageLeave}
        />
        <RecentHires employees={employees} onViewAll={canManageLeave ? onViewAllHires : undefined} />
      </div>
      {user?.role === "admin" ? (
        <RecruitmentPipeline candidates={recruitment.candidates} openings={recruitment.openings} onOpenBoard={onOpenBoard} />
      ) : null}
    </div>
  )
}

function toISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function LeaveRequestsCard({
  pending,
  onApprove,
  onDecline,
  canManage,
}: {
  pending: LeaveRequest[]
  onApprove: (id: string) => void
  onDecline: (id: string) => void
  canManage: boolean
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px] shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
          Leave requests
        </h3>
        <span className="inline-block rounded-full bg-foreground/10 px-2 py-[3px] font-sans text-[11px] font-semibold leading-normal text-secondary-foreground">
          {pending.length} pending
        </span>
      </div>
      {pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-[12.5px] text-muted-foreground">
          No pending requests. You’re all caught up.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pending.slice(0, 4).map((req) => (
            <div key={req.id} className="flex items-center gap-[11px]">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                <span className="font-sans text-[11px] font-semibold text-primary">
                  {req.initials}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-sans text-[13px] font-semibold leading-normal text-foreground">
                  {req.employeeName}
                </span>
                <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
                  {req.days} day{req.days === 1 ? "" : "s"}
                </span>
              </div>
              {canManage ? (
                <>
                  <button
                    type="button"
                    aria-label={`Approve ${req.employeeName}`}
                    onClick={() => onApprove(req.id)}
                    className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-secondary-foreground hover:bg-foreground/20"
                  >
                    <Check className="size-[15px]" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Decline ${req.employeeName}`}
                    onClick={() => onDecline(req.id)}
                    className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground hover:bg-foreground/20"
                  >
                    <X className="size-[15px]" strokeWidth={2} />
                  </button>
                </>
              ) : (
                <span className="inline-block shrink-0 rounded-full bg-muted px-2.5 py-1 font-sans text-[11px] font-semibold leading-normal text-muted-foreground">
                  Awaiting approval
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
