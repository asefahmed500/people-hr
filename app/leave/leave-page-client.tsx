"use client"

import * as React from "react"

import { STORAGE_KEYS, defaultLeaveStore, defaultNotificationsStore, leaveTypeLabel, newNotification, type LeaveRequest, type LeaveStore, type LeaveType, type NotificationsStore, type Notification } from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"
import { onAction } from "@/lib/command-actions"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { z } from "zod"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField, TextArea, useForm } from "@/components/shared/field"
import { LeaveHeader } from "@/components/leave/leave-header"
import { LeaveKpiStrip } from "@/components/leave/leave-kpi-strip"
import { PendingRequests } from "@/components/leave/pending-requests"
import { BalanceByType } from "@/components/leave/balance-by-type"
import { ChevronLeft, ChevronRight } from "lucide-react"

const requestSchema = z.object({
  type: z.string().min(1),
  startDate: z.string().min(1, "Pick a start date"),
  endDate: z.string().min(1, "Pick an end date"),
  reason: z.string().min(2, "Add a brief reason"),
}).refine((d) => d.endDate >= d.startDate, {
  path: ["endDate"],
  message: "End date must be on or after the start date",
})

const pillStyles: Record<LeaveType, { bg: string; text: string; label: string }> = {
  vac: { bg: "bg-[#c14d6d1a]", text: "text-[#c14d6d]", label: "Vac" },
  sick: { bg: "bg-[#64748b1a]", text: "text-[#64748b]", label: "Sick" },
  pers: { bg: "bg-[#d98a2b1a]", text: "text-[#d98a2b]", label: "Pers" },
  par: { bg: "bg-[#42504a1a]", text: "text-[#42504a]", label: "Par" },
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function LeavePageClient() {
  const { state: store, setState: setStore } = useMockStore<LeaveStore>(
    STORAGE_KEYS.leave,
    () => defaultLeaveStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }
  const [monthOffset, setMonthOffset] = React.useState(0)
  const [daySheetDate, setDaySheetDate] = React.useState<string | null>(null)
  const [requestOpen, setRequestOpen] = React.useState(false)

  React.useEffect(
    () =>
      onAction((id) => {
        if (id === "request-leave") setRequestOpen(true)
      }),
    [],
  )

  const base = new Date(2025, 1, 18)
  const monthDate = new Date(2025, 1 + monthOffset, 1)
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const firstWeekday = (monthDate.getDay() + 6) % 7
  const daysInMonth = new Date(2025, 2 + monthOffset, 0).getDate()
  const todayISO = toISO(base)

  const cells: { day: number | null; iso: string | null }[] = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push({ day: null, iso: null })
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = toISO(new Date(2025, 1 + monthOffset, d))
    cells.push({ day: d, iso })
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, iso: null })

  const requestsForDay = (iso: string) =>
    store.requests.filter(
      (r) => r.status !== "declined" && iso >= r.startDate && iso <= r.endDate,
    )

  const onApprove = (id: string) => {
    setStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status: "approved" as const } : r,
      ),
    }))
    notify.success("Leave approved")
    const req = store.requests.find((r) => r.id === id)
    if (req) addNotification({ type: "leave_approved", title: "Leave approved", description: `${req.employeeName}'s leave approved`, href: "/leave" })
  }

  const onDecline = (id: string) => {
    setStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status: "declined" as const } : r,
      ),
    }))
    notify.info("Leave declined")
    const req = store.requests.find((r) => r.id === id)
    if (req) addNotification({ type: "leave_declined", title: "Leave declined", description: `${req.employeeName}'s leave declined` })
  }

  const pending = store.requests.filter((r) => r.status === "pending")
  const dayRequests = daySheetDate ? requestsForDay(daySheetDate) : []

  return (
    <>
      <LeaveHeader onRequestClick={() => setRequestOpen(true)} monthLabel={monthLabel} />
      <LeaveKpiStrip
        onLeaveToday={store.requests.filter((r) => inRange(r, todayISO)).length}
        pending={pending.length}
        approvedFeb={store.requests.filter((r) => r.status === "approved").length}
        sickToday={store.requests.filter((r) => r.type === "sick" && inRange(r, todayISO)).length}
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4 overflow-clip rounded-[18px] border border-[#ece9e2] bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
                {monthLabel}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setMonthOffset((m) => m - 1)}
                  className="flex size-7 items-center justify-center rounded-lg border border-[#edeae3] bg-white"
                >
                  <ChevronLeft className="size-4 text-[#6b7770]" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setMonthOffset((m) => m + 1)}
                  className="flex size-7 items-center justify-center rounded-lg border border-[#edeae3] bg-white"
                >
                  <ChevronRight className="size-4 text-[#6b7770]" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {(["vac", "sick", "pers"] as LeaveType[]).map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      t === "vac" && "bg-[#c14d6d]",
                      t === "sick" && "bg-[#64748b]",
                      t === "pers" && "bg-[#d98a2b]",
                    )}
                  />
                  <span className="font-sans text-[11px] leading-normal text-[#6b7770]">
                    {leaveTypeLabel[t]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="flex justify-center">
                <span className="font-sans text-[10px] font-semibold uppercase leading-normal tracking-[0.25px] text-[#8a948d]">
                  {day}
                </span>
              </div>
            ))}
            {cells.map((cell, idx) => {
              if (cell.day === null) {
                return (
                  <div
                    key={idx}
                    className="min-h-[64px] rounded-[10px] border border-[#f1eee8] bg-[#faf9f6] p-[5px]"
                  />
                )
              }
              const dayReqs = requestsForDay(cell.iso!)
              const isToday = cell.iso === todayISO
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDaySheetDate(cell.iso)}
                  className={cn(
                    "relative flex min-h-[64px] flex-col gap-[3px] rounded-[10px] border p-[5px] text-left",
                    isToday
                      ? "border-[#c14d6d] bg-[#c14d6d1a]"
                      : "border-[#f1eee8] bg-white hover:border-[#e3ded4]",
                  )}
                >
                  <span
                    className={cn(
                      "font-sans text-[11px] font-medium leading-normal",
                      isToday ? "font-semibold text-[#c14d6d]" : "text-[#8a948d]",
                    )}
                  >
                    {cell.day}
                  </span>
                  {dayReqs.slice(0, 2).map((r) => {
                    const s = pillStyles[r.type]
                    return (
                      <span
                        key={r.id}
                        className={cn(
                          "flex items-center gap-[3px] rounded px-1 py-0.5",
                          s.bg,
                        )}
                      >
                        <span
                          className={cn(
                            "font-sans text-[9px] font-semibold leading-none",
                            s.text,
                          )}
                        >
                          {r.initials} {s.label}
                        </span>
                      </span>
                    )
                  })}
                  {dayReqs.length > 2 ? (
                    <span className="font-sans text-[9px] font-semibold text-[#8a948d]">
                      +{dayReqs.length - 2} more
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-5 lg:w-[340px] lg:shrink-0">
          <PendingRequests
            requests={store.requests}
            onApprove={onApprove}
            onDecline={onDecline}
          />
          <BalanceByType balances={store.balances["e-asef"]} />
        </div>
      </div>

      <Sheet open={!!daySheetDate} onOpenChange={(o) => !o && setDaySheetDate(null)}>
        <SheetContent
          side="right"
          className="w-full gap-4 border-l border-[#ece9e2] bg-white p-6 sm:max-w-[420px]"
        >
          <SheetHeader>
            <SheetTitle className="font-display text-[18px] font-semibold text-[#1f2a26]">
              {daySheetDate
                ? new Date(daySheetDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </SheetTitle>
            <SheetDescription className="font-sans text-[12.5px] text-[#8a948d]">
              {dayRequests.length === 0
                ? "No leave scheduled."
                : `${dayRequests.length} on leave.`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2.5">
            {dayRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#edeae3] bg-[#faf9f6] px-4 py-6 text-center font-sans text-[12.5px] text-[#8a948d]">
                Quiet day. Nothing scheduled.
              </div>
            ) : (
              dayRequests.map((r) => {
                const s = pillStyles[r.type]
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#2f6f611a]">
                      <span className="font-sans text-[11px] font-semibold text-[#2f6f61]">
                        {r.initials}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-sans text-[12.5px] font-semibold text-[#1f2a26]">
                        {r.employeeName}
                      </span>
                      <span className="font-sans text-[11px] text-[#8a948d]">
                        {leaveTypeLabel[r.type]} · {r.reason}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold",
                        s.bg,
                        s.text,
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      <RequestLeaveDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        onSubmit={(req) => {
          setStore((prev) => {
            const typeKey: Record<string, "annual" | "sick" | "personal" | "parental"> = {
              vac: "annual",
              sick: "sick",
              pers: "personal",
              par: "parental",
            }
            const key = typeKey[req.type]
            const userBal = prev.balances["e-asef"]
            return {
              ...prev,
              requests: [req, ...prev.requests],
              balances: {
                ...prev.balances,
                "e-asef": userBal
                  ? { ...userBal, [key]: { ...userBal[key], used: userBal[key].used + req.days } }
                  : userBal,
              },
            }
          })
          notify.success("Leave requested", `${req.employeeName}: ${req.days} day(s)`)
          addNotification({ type: "leave_requested", title: "Leave requested", description: `${req.employeeName} requested ${req.days} day(s) of ${leaveTypeLabel[req.type]}`, href: "/leave" })
        }}
      />
    </>
  )
}

function RequestLeaveDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (req: LeaveRequest) => void
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({
    type: "vac",
    startDate: "2025-03-10",
    endDate: "2025-03-12",
    reason: "",
  })

  const onConfirm = () => {
    const parsed = requestSchema.safeParse(form.values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      form.setErrors(fieldErrors as never)
      return
    }
    setSubmitting(true)
    try {
      const days =
        (new Date(parsed.data.endDate).getTime() -
          new Date(parsed.data.startDate).getTime()) /
          86400_000 +
        1
      onSubmit({
        id: `lr-${Math.random().toString(36).slice(2, 9)}`,
        employeeId: "e-asef",
        employeeName: "Asef Ahmed",
        initials: "AA",
        type: parsed.data.type as LeaveType,
        status: "pending",
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        days,
        reason: parsed.data.reason,
      })
      form.reset({
        type: "vac",
        startDate: "2025-03-10",
        endDate: "2025-03-12",
        reason: "",
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Request leave"
      description="Your request will be sent to your manager for approval."
      submitLabel="Submit request"
      submitting={submitting}
      onSubmit={onConfirm}
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <SelectField
          label="Type"
          value={form.values.type}
          onChange={(v) => form.setValue("type", v)}
          options={[
            { value: "vac", label: "Vacation" },
            { value: "sick", label: "Sick" },
            { value: "pers", label: "Personal" },
            { value: "par", label: "Parental" },
          ]}
          required
        />
        <div className="grid grid-cols-2 gap-3.5">
          <Field
            label="Start"
            type="date"
            value={form.values.startDate}
            onChange={(v) => form.setValue("startDate", v)}
            required
            error={form.errors.startDate}
          />
          <Field
            label="End"
            type="date"
            value={form.values.endDate}
            onChange={(v) => form.setValue("endDate", v)}
            required
            error={form.errors.endDate}
          />
        </div>
      </div>
      <TextArea
        label="Reason"
        value={form.values.reason}
        onChange={(v) => form.setValue("reason", v)}
        placeholder="Brief note for your manager"
      />
    </ActionDialog>
  )
}

function toISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function inRange(r: LeaveRequest, iso: string) {
  return r.status !== "declined" && iso >= r.startDate && iso <= r.endDate
}
