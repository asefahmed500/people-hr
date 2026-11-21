"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AttendanceHeader } from "@/components/attendance/attendance-header"
import { TodayStatusCard } from "@/components/attendance/today-status-card"
import { AttendanceKpis } from "@/components/attendance/attendance-kpis"
import { DeptHeatCard } from "@/components/attendance/dept-heat-card"
import { LiveCheckins } from "@/components/attendance/live-checkins"
import { FaceCheckinCard } from "@/components/attendance/face-checkin-card"
import { FaceRegistrationsCard } from "@/components/attendance/face-registrations-card"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SelectField } from "@/components/shared/field"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Pencil, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { defaultCheckIns, defaultEmployees, type AttendanceStore, type CheckIn, type Employee } from "@/lib/data"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { cn } from "@/lib/utils"

export function AttendancePageClient() {
  const {
    state,
    setState,
    refresh,
    hydrated: attendanceHydrated,
    error: attendanceError,
    retry: retryAttendance,
  } = useApiStore<AttendanceStore>(
    "/api/store/attendance",
    () => ({ checkIns: defaultCheckIns }),
  )
  const {
    state: employees,
    hydrated: employeesHydrated,
    error: employeesError,
    retry: retryEmployees,
  } = useApiStore<Employee[]>(
    "/api/store/employees",
    () => defaultEmployees,
  )
  const { user } = useAuth()
  // Attendance writes are admin/manager-only. Employees check in through the
  // face scanner, whose identity is verified server-side.
  const canWrite = user?.role === "admin" || user?.role === "manager"
  const canMarkAnyone = canWrite
  const hydrated = attendanceHydrated && employeesHydrated
  const error = attendanceError || employeesError
  const retry = () => {
    retryAttendance()
    retryEmployees()
  }
  const [markOpen, setMarkOpen] = useState(false)
  const [markStatus, setMarkStatus] = useState("on-time")
  const [selectedCheckin, setSelectedCheckin] = useState<CheckIn | null>(null)
  const [editCheckin, setEditCheckin] = useState<CheckIn | null>(null)
  const [deleteCheckin, setDeleteCheckin] = useState<CheckIn | null>(null)
  const [editStatus, setEditStatus] = useState("on-time")

  // Even an employee's own check-in is server-managed (face verified), so no
  // manual edit/delete is offered to non-admins.
  const canWriteSelected = canWrite

  const todayIso = () => new Date().toISOString().slice(0, 10)
  const nowTime = () =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })

  // Self-service clock-in: one check-in per person per day.
  const myCheckinToday =
    user && user.name
      ? state.checkIns.find((c) => c.name === user.name && c.date === todayIso())
      : undefined

  function clockIn(name: string, dept: string, initials: string) {
    const status: CheckIn["status"] = nowTime() <= "09:30" ? "on-time" : "late"
    setState((prev) => ({
      checkIns: [
        {
          id: `ci-${Date.now()}`,
          initials,
          name,
          dept,
          time: nowTime(),
          status,
          date: todayIso(),
        },
        ...prev.checkIns,
      ],
    }))
    notify.success(`Clocked in at ${nowTime()}`, `Have a great day â€” recorded as ${status.replace("-", " ")}.`)

  }

  const defaultEmployeeId = user
    ? (employees.find((e) => e.name === user.name)?.id ?? employees[0]?.id)
    : employees[0]?.id
  const [markEmployeeId, setMarkEmployeeId] = useState<string>("")

  if (error) {
    return (
      <DashboardShell activeHref="/attendance" current="Attendance" accentCurrent>
        <StoreErrorState onRetry={retry} />
      </DashboardShell>
    )
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/attendance" current="Attendance" accentCurrent>
        <div className="flex w-full items-start gap-4">
          <Skeleton className="h-[400px] w-full shrink-0 rounded-lg sm:w-[380px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[130px] flex-1 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-[180px] rounded-lg" />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-lg" />
          ))}
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/attendance" current="Attendance" accentCurrent>
      <AttendanceHeader
        onExport={() => {
          exportToCsv("attendance", state.checkIns, [
            { key: "name", label: "Name" },
            { key: "dept", label: "Department" },
            { key: "time", label: "Check-in time" },
            { key: "status", label: "Status" },
          ])
          notify.success("Attendance exported", `${state.checkIns.length} check-ins downloaded as CSV.`)
        }}
        onClockIn={
          // Free self clock-in stays available to admins/managers only â€”
          // employees check in through the face scanner below (identity is
          // verified server-side against their approved face registration).
          canMarkAnyone && user?.name
            ? () => {
                if (myCheckinToday) {
                  notify.info("Already checked in", `You clocked in today at ${myCheckinToday.time}.`)
                  return
                }
                const emp = employees.find((e) => e.name === user.name)
                clockIn(
                  user.name,
                  emp?.department ?? user.department ?? "People",
                  emp?.initials ??
                    (user.name ?? "ME")
                      .split(/\s+/)
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase(),
                )
              }
            : undefined
        }
        clockedInTime={myCheckinToday?.time ?? null}
        onMarkAttendance={
          canWrite
            ? () => {
                setMarkEmployeeId((v) => v || defaultEmployeeId || "")
                setMarkOpen(true)
              }
            : undefined
        }
      />
      <div className="flex w-full flex-col items-start gap-4 lg:flex-row">
        <TodayStatusCard checkIns={state.checkIns} />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <AttendanceKpis checkIns={state.checkIns} />
          <DeptHeatCard checkIns={state.checkIns} />
        </div>
      </div>
      <FaceCheckinCard
        alreadyCheckedInTime={myCheckinToday?.time ?? null}
        onCheckedIn={() => void refresh()}
      />
      <LiveCheckins checkIns={state.checkIns} onSelect={setSelectedCheckin} />
      {user?.role === "admin" ? <FaceRegistrationsCard onChanged={() => void refresh()} /> : null}
      <Sheet open={!!selectedCheckin} onOpenChange={(o) => !o && setSelectedCheckin(null)}>
        <SheetContent side="right" className="w-full gap-4 border-l border-border bg-card p-4 sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-h4">
              Employee details
            </SheetTitle>
            <SheetDescription className="font-sans text-[12.5px] text-muted-foreground">
              Check-in information
            </SheetDescription>
          </SheetHeader>
          {selectedCheckin ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-full text-base font-semibold",
                    selectedCheckin.status === "on-time" && "bg-foreground/10 text-primary",
                    selectedCheckin.status === "late" && "bg-foreground/10 text-secondary-foreground",
                    selectedCheckin.status === "remote" && "bg-foreground/10 text-muted-foreground",
                  )}
                >
                  {selectedCheckin.initials}
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[17px] font-semibold leading-tight text-foreground">
                    {selectedCheckin.name}
                  </span>
                  <span className="font-sans text-[13px] leading-normal text-muted-foreground">
                    {selectedCheckin.dept}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[12px] font-medium text-muted-foreground">Check-in time</span>
                  <span className="font-sans text-[13px] font-semibold text-foreground">{selectedCheckin.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[12px] font-medium text-muted-foreground">Status</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold",
                      selectedCheckin.status === "on-time" && "bg-primary/10 text-primary",
                      selectedCheckin.status === "late" && "bg-secondary-foreground/10 text-secondary-foreground",
                      selectedCheckin.status === "remote" && "bg-muted-foreground/10 text-muted-foreground",
                    )}
                  >
                    {selectedCheckin.status === "on-time" ? "On time" : selectedCheckin.status === "late" ? "Late" : "Remote"}
                  </span>
                </div>
              </div>
              {canWriteSelected ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditStatus(selectedCheckin.status)
                      setEditCheckin(selectedCheckin)
                    }}
                    className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card font-sans text-[12.5px] font-medium text-secondary-foreground hover:bg-muted"
                  >
                    <Pencil className="size-3.5" strokeWidth={2} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCheckin(selectedCheckin)}
                    className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card font-sans text-[12.5px] font-medium text-foreground hover:bg-muted"
                  >
                    <Trash2 className="size-3.5" strokeWidth={2} />
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <ActionDialog width="wide"
        open={markOpen}
        onOpenChange={(o) => {
          setMarkOpen(o)
          if (!o) setMarkEmployeeId("")
        }}
        title="Mark attendance"
        submitLabel="Save"
        onSubmit={() => {
          const emp = employees.find((e) => e.id === markEmployeeId)
          if (!emp) {
            notify.error("Select an employee", "Pick a person to mark attendance for.")
            return
          }
          setState((prev) => ({
            checkIns: [
              {
                id: `ci-${Date.now()}`,
                initials: emp.initials,
                name: emp.name,
                dept: emp.department,
                time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
                status: markStatus as CheckIn["status"],
                date: todayIso(),
              },
              ...prev.checkIns,
            ],
          }))
          notify.success(`Attendance marked`, `${emp.name} checked in as ${markStatus.replace("-", " ")}.`)

          setMarkOpen(false)
          setMarkEmployeeId("")
          setMarkStatus("on-time")
        }}
      >
        <SelectField
          label="Employee"
          value={markEmployeeId}
          onChange={setMarkEmployeeId}
          options={employees.map((e) => ({ value: e.id, label: `${e.name} Â· ${e.department}` }))}
          disabled={!canMarkAnyone}
          required
        />
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

      <ActionDialog width="wide"
        open={!!editCheckin}
        onOpenChange={(o) => { if (!o) setEditCheckin(null) }}
        title="Edit check-in"
        description={editCheckin ? `Update ${editCheckin.name}'s check-in status.` : ""}
        submitLabel="Save"
        onSubmit={() => {
          if (!editCheckin) return
          setState((prev) => ({
            checkIns: prev.checkIns.map((c) =>
              c.id === editCheckin.id ? { ...c, status: editStatus as CheckIn["status"] } : c,
            ),
          }))
          notify.success("Check-in updated", `${editCheckin.name} marked as ${editStatus.replace("-", " ")}.`)

          setEditCheckin(null)
        }}
      >
        <SelectField
          label="Status"
          value={editStatus}
          onChange={setEditStatus}
          options={[
            { value: "on-time", label: "On time" },
            { value: "late", label: "Late" },
            { value: "remote", label: "Remote" },
          ]}
          required
        />
      </ActionDialog>

      <ConfirmDialog
        open={!!deleteCheckin}
        onOpenChange={(o) => { if (!o) setDeleteCheckin(null) }}
        title="Delete check-in"
        description={deleteCheckin ? `Remove ${deleteCheckin.name}'s check-in? This canâ€™t be undone.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteCheckin) {
            setState((prev) => ({
              checkIns: prev.checkIns.filter((c) => c.id !== deleteCheckin.id),
            }))
            notify.success("Check-in deleted", `${deleteCheckin.name}'s check-in removed.`)

            setSelectedCheckin(null)
          }
          setDeleteCheckin(null)
        }}
      />
    </DashboardShell>
  )
}
