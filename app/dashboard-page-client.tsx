"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  STORAGE_KEYS,
  type LeaveRequest,
  type LeaveStore,
  type Employee,
  defaultEmployees,
  type RecruitmentStore,
  defaultRecruitmentStore,
  type AttendanceStore,
  defaultCheckIns,
  type ProjectsStore,
  defaultProjectsStore,
  defaultNotificationsStore,
  newNotification,
  type NotificationsStore,
  type Notification,
} from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"
import { notify } from "@/lib/toast"
import { GreetingBanner } from "@/components/dashboard/greeting-banner"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { HeadcountChart } from "@/components/dashboard/headcount-chart"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { AttendanceCard } from "@/components/dashboard/attendance-card"
import { RecentHires } from "@/components/dashboard/recent-hires"
import { RecruitmentPipeline } from "@/components/dashboard/recruitment-pipeline"

export function DashboardPageClient() {
  const router = useRouter()

  const { state: leaveStore, setState: setLeaveStore } = useMockStore<LeaveStore>(
    STORAGE_KEYS.leave,
    () => ({
      requests: [],
      balances: {},
    }),
  )

  const { state: employees } = useMockStore<Employee[]>(
    STORAGE_KEYS.employees,
    () => defaultEmployees,
  )

  const { state: recruitment } = useMockStore<RecruitmentStore>(
    STORAGE_KEYS.recruitment,
    () => defaultRecruitmentStore,
  )

  const { state: attendance } = useMockStore<AttendanceStore>(
    STORAGE_KEYS.attendance,
    () => ({ checkIns: defaultCheckIns }),
  )

  const { state: projects } = useMockStore<ProjectsStore>(
    STORAGE_KEYS.projects,
    () => defaultProjectsStore,
  )

  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }

  const pending = leaveStore.requests.filter((r) => r.status === "pending")

  const onApprove = (id: string) => {
    setLeaveStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status: "approved" } : r,
      ),
    }))
    const req = leaveStore.requests.find((r) => r.id === id)
    notify.success("Leave approved", req ? `Approved ${req.employeeName}'s request.` : undefined)
    if (req) addNotification({ type: "leave_approved", title: "Leave approved", description: `${req.employeeName}'s leave approved`, href: "/leave" })
  }

  const onDecline = (id: string) => {
    setLeaveStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status: "declined" } : r,
      ),
    }))
    const req = leaveStore.requests.find((r) => r.id === id)
    notify.info("Leave declined", req ? `Declined ${req.employeeName}'s request.` : undefined)
    if (req) addNotification({ type: "leave_declined", title: "Leave declined", description: `${req.employeeName}'s leave declined` })
  }

  const onViewAllHires = () => router.push("/employees")
  const onOpenBoard = () => router.push("/recruitment")
  const onOpenAssistant = () => router.push("/assistant")

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <GreetingBanner employeeCount={employees.length} />
      <KpiRow
        employees={employees}
        pendingLeave={pending.length}
        openRoles={recruitment.openings.length}
        projectsCount={projects.tasks.length}
      />
      <div className="flex w-full flex-col gap-6 xl:h-[392px] xl:flex-row">
        <HeadcountChart employees={employees} />
        <InsightsPanel onOpenAssistant={onOpenAssistant} />
      </div>
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
        <AttendanceCard attendance={attendance} employees={employees} />
        <LeaveRequestsCard
          pending={pending}
          onApprove={onApprove}
          onDecline={onDecline}
        />
        <RecentHires employees={employees} onViewAll={onViewAllHires} />
      </div>
      <RecruitmentPipeline candidates={recruitment.candidates} openings={recruitment.openings} onOpenBoard={onOpenBoard} />
    </div>
  )
}

function LeaveRequestsCard({
  pending,
  onApprove,
  onDecline,
}: {
  pending: LeaveRequest[]
  onApprove: (id: string) => void
  onDecline: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[18px] border border-[#ece9e2] bg-white p-[22px] shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <div className="flex items-center justify-between">
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
          Leave requests
        </h3>
        <span className="inline-block rounded-full bg-[#f4a26129] px-2 py-[3px] font-sans text-[11px] font-semibold leading-normal text-[#d98842]">
          {pending.length} pending
        </span>
      </div>
      {pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#edeae3] bg-[#faf9f6] px-4 py-6 text-center font-sans text-[12.5px] text-[#8a948d]">
          No pending requests. You’re all caught up.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pending.slice(0, 4).map((req) => (
            <div key={req.id} className="flex items-center gap-[11px]">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2f6f611a]">
                <span className="font-sans text-[11px] font-semibold text-[#2f6f61]">
                  {req.initials}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-sans text-[13px] font-semibold leading-normal text-[#1f2a26]">
                  {req.employeeName}
                </span>
                <span className="font-sans text-[11.5px] leading-normal text-[#8a948d]">
                  {req.days} day{req.days === 1 ? "" : "s"}
                </span>
              </div>
              <button
                type="button"
                aria-label={`Approve ${req.employeeName}`}
                onClick={() => onApprove(req.id)}
                className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#3bb2731f] text-[#2e9160] hover:bg-[#3bb2732e]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-[15px]"
                >
                  <path d="M5 12l5 5l10 -10" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={`Decline ${req.employeeName}`}
                onClick={() => onDecline(req.id)}
                className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#e76f511f] text-[#c4553a] hover:bg-[#e76f512e]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-[15px]"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
