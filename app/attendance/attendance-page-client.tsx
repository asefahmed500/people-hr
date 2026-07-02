"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AttendanceHeader } from "@/components/attendance/attendance-header"
import { TodayStatusCard } from "@/components/attendance/today-status-card"
import { AttendanceKpis } from "@/components/attendance/attendance-kpis"
import { DeptHeatCard } from "@/components/attendance/dept-heat-card"
import { LiveCheckins } from "@/components/attendance/live-checkins"
import type { Checkin } from "@/components/attendance/live-checkins"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField } from "@/components/shared/field"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useMockStore } from "@/hooks/use-mock-store"
import { STORAGE_KEYS, defaultCheckIns, defaultNotificationsStore, newNotification, type NotificationsStore, type Notification } from "@/lib/data"
import type { AttendanceStore, CheckIn } from "@/lib/data"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"

export function AttendancePageClient() {
  const { state, setState, hydrated } = useMockStore<AttendanceStore>(
    STORAGE_KEYS.attendance,
    () => ({ checkIns: defaultCheckIns }),
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }
  const [markOpen, setMarkOpen] = useState(false)
  const [markDate, setMarkDate] = useState("")
  const [markStatus, setMarkStatus] = useState("on-time")
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null)

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/attendance" current="Attendance" accentCurrent>
        <div className="flex w-full items-start gap-6">
          <Skeleton className="h-[400px] w-[380px] shrink-0 rounded-[18px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[130px] flex-1 rounded-[18px]" />
              ))}
            </div>
            <Skeleton className="h-[180px] rounded-[18px]" />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-[18px]" />
          ))}
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/attendance" current="Attendance" accentCurrent>
      <AttendanceHeader
        onThisWeek={() => notify.info("Week view")}
        onExport={() => notify.success("Attendance exported")}
        onMarkAttendance={() => setMarkOpen(true)}
      />
      <div className="flex w-full items-start gap-6">
        <TodayStatusCard />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <AttendanceKpis />
          <DeptHeatCard />
        </div>
      </div>
      <LiveCheckins checkIns={state.checkIns} onSelect={setSelectedCheckin} />
      <Sheet open={!!selectedCheckin} onOpenChange={(o) => !o && setSelectedCheckin(null)}>
        <SheetContent side="right" className="w-full gap-5 border-l border-[#ece9e2] bg-white p-6 sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="font-display text-[18px] font-semibold text-[#1f2a26]">
              Employee details
            </SheetTitle>
            <SheetDescription className="font-sans text-[12.5px] text-[#8a948d]">
              Check-in information
            </SheetDescription>
          </SheetHeader>
          {selectedCheckin ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-full text-base font-bold",
                    selectedCheckin.status === "on-time" && "bg-[#2f6f611a] text-[#2f6f61]",
                    selectedCheckin.status === "late" && "bg-[#b96a2c1a] text-[#b96a2c]",
                    selectedCheckin.status === "remote" && "bg-[#3e94881a] text-[#3e9488]",
                  )}
                >
                  {selectedCheckin.initials}
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[17px] font-semibold leading-tight text-[#1f2a26]">
                    {selectedCheckin.name}
                  </span>
                  <span className="font-sans text-[13px] leading-normal text-[#8a948d]">
                    {selectedCheckin.dept}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[12px] font-medium text-[#8a948d]">Check-in time</span>
                  <span className="font-sans text-[13px] font-semibold text-[#1f2a26]">{selectedCheckin.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[12px] font-medium text-[#8a948d]">Status</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold",
                      selectedCheckin.status === "on-time" && "bg-[#2e91601a] text-[#2e9160]",
                      selectedCheckin.status === "late" && "bg-[#b96a2c1a] text-[#b96a2c]",
                      selectedCheckin.status === "remote" && "bg-[#3e94881a] text-[#3e9488]",
                    )}
                  >
                    {selectedCheckin.status === "on-time" ? "On time" : selectedCheckin.status === "late" ? "Late" : "Remote"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <ActionDialog
        open={markOpen}
        onOpenChange={setMarkOpen}
        title="Mark attendance"
        submitLabel="Save"
        onSubmit={() => {
          setState((prev) => ({
            checkIns: [
              {
                id: `ci-${Date.now()}`,
                initials: "AA",
                name: "Asef Ahmed",
                dept: "Engineering",
                time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
                status: markStatus as CheckIn["status"],
              },
              ...prev.checkIns,
            ],
          }))
          notify.success(`Attendance marked for ${markDate || "today"} as ${markStatus.replace("-", " ")}`)
          addNotification({ type: "employee_added", title: "Attendance marked", description: `Asef Ahmed checked in as ${markStatus.replace("-", " ")}` })
          setMarkOpen(false)
          setMarkDate("")
          setMarkStatus("on-time")
        }}
      >
        <Field label="Date" type="date" value={markDate} onChange={setMarkDate} required />
        <SelectField
          label="Status"
          value={markStatus}
          onChange={setMarkStatus}
          options={[
            { value: "on-time", label: "On time" },
            { value: "late", label: "Late" },
            { value: "remote", label: "Remote" },
          ]}
          required
        />
      </ActionDialog>
    </DashboardShell>
  )
}
