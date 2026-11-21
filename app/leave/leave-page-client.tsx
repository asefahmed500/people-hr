"use client"

import * as React from "react"

import {
  defaultLeaveStore,
  defaultEmployees,
  leaveTypeLabel,
  adjustBalance,
  type LeaveRequest,
  type LeaveStore,
  type LeaveType,
  type Employee,
} from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { onAction, consumePendingAction } from "@/lib/command-actions"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
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
import { StoreErrorState } from "@/components/shared/store-error-state"
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
  halfDay: z.boolean(),
}).refine((d) => (d.halfDay ? true : d.endDate >= d.startDate), {
  path: ["endDate"],
  message: "End date must be on or after the start date",
})

const pillStyles: Record<LeaveType, { bg: string; text: string; label: string }> = {
  vac: { bg: "bg-primary/10", text: "text-primary", label: "Vac" },
  sick: { bg: "bg-secondary-foreground/10", text: "text-secondary-foreground", label: "Sick" },
  pers: { bg: "bg-muted-foreground/10", text: "text-muted-foreground", label: "Pers" },
  par: { bg: "bg-foreground/10", text: "text-foreground", label: "Par" },
}

const typeDot: Record<LeaveType, string> = {
  vac: "bg-primary",
  sick: "bg-secondary-foreground",
  pers: "bg-muted-foreground",
  par: "bg-foreground",
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function LeavePageClient() {
  const {
    state: store,
    setState: setStore,
    hydrated: leaveHydrated,
    error: leaveError,
    retry: retryLeave,
  } = useApiStore<LeaveStore>(
    "/api/store/leave",
    () => defaultLeaveStore,
  )
  const {
    hydrated: employeesHydrated,
    error: employeesError,
    retry: retryEmployees,
  } = useApiStore<Employee[]>(
    "/api/store/employees",
    () => defaultEmployees,
  )
  const { user } = useAuth()
  // Managers without a department are self-scoped on the server, so they get
  // the employee controls (edit/cancel), not approve/decline.
  const canManage =
    user?.role === "admin" || (user?.role === "manager" && !!user?.department)
  const hydrated = leaveHydrated && employeesHydrated
  const error = leaveError || employeesError
  const retry = () => {
    retryLeave()
    retryEmployees()
  }
  const [monthOffset, setMonthOffset] = React.useState(0)
  const [daySheetDate, setDaySheetDate] = React.useState<string | null>(null)
  const [requestOpen, setRequestOpen] = React.useState(false)
  const [editingRequest, setEditingRequest] = React.useState<LeaveRequest | null>(null)

  const requester = {
    id: user?.id ?? "e-asef",
    name: user?.name ?? "Asef Ahmed",
    initials: user?.initials ?? "AA",
  }

  React.useEffect(() => {
    const off = onAction((id) => {
      if (id === "request-leave") setRequestOpen(true)
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (consumePendingAction("request-leave")) setRequestOpen(true)
    return off
  }, [])

  const now = new Date()
  const baseYear = now.getFullYear()
  const baseMonth = now.getMonth()
  const monthDate = new Date(baseYear, baseMonth + monthOffset, 1)
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
  const monthPrefix = toISO(monthDate).slice(0, 7)

  const firstWeekday = (monthDate.getDay() + 6) % 7
  const daysInMonth = new Date(baseYear, baseMonth + monthOffset + 1, 0).getDate()
  const todayISO = toISO(now)

  const cells: { day: number | null; iso: string | null }[] = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push({ day: null, iso: null })
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = toISO(new Date(baseYear, baseMonth + monthOffset, d))
    cells.push({ day: d, iso })
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, iso: null })

  const requestsForDay = (iso: string) =>
    store.requests.filter(
      (r) => r.status !== "declined" && iso >= r.startDate && iso <= r.endDate,
    )

  const onApprove = (id: string) => {
    const req = store.requests.find((r) => r.id === id)
    if (!req || req.status !== "pending") return
    setStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status: "approved" as const } : r,
      ),
      // Deduct from the balance only when actually approved.
      balances: adjustBalance(prev.balances, req, req.days),
    }))
    // The employees API derives "on leave" status from live approved requests
    // on read ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â do not attempt a privileged cross-module status write here
    // (it is admin-only and produced a false error toast for managers).
    notify.success("Leave approved", `Approved ${req.employeeName}'s ${req.days}-day request.`)

  }

  const onDecline = (id: string) => {
    const req = store.requests.find((r) => r.id === id)
    if (!req || req.status !== "pending") return
    setStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status: "declined" as const } : r,
      ),
    }))
    notify.info("Leave declined", `Declined ${req.employeeName}'s request.`)

  }

  const pending = store.requests.filter((r) => r.status === "pending")

  const isOwn = (req: LeaveRequest) =>
    req.employeeId === requester.id || req.employeeName === requester.name

  const handleCancelRequest = (id: string) => {
    const req = store.requests.find((r) => r.id === id)
    if (!req || !isOwn(req)) return
    const wasApproved = req.status === "approved"
    if (!wasApproved && req.status !== "pending") return
    setStore((prev) => ({
      ...prev,
      requests: prev.requests.filter((r) => r.id !== id),
      // An approved request had already consumed days ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â give them back when
      // it is removed. Pending requests never touched the balance.
      ...(wasApproved
        ? { balances: adjustBalance(prev.balances, req, -req.days) }
        : {}),
    }))
    notify.info("Request cancelled", `Removed ${req.employeeName}'s ${req.days}-day request.`)

  }

  const handleSubmitEdit = (updated: LeaveRequest) => {
    setStore((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === updated.id ? updated : r)),
    }))
    notify.success("Request updated", `${updated.employeeName}: ${updated.days} day(s)`)
    setEditingRequest(null)
  }

  const dayRequests = daySheetDate ? requestsForDay(daySheetDate) : []

  if (error) {
    return <StoreErrorState onRetry={retry} />
  }

  if (!hydrated) {
    return (
      <>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </>
    )
  }

  return (
    <>
      <LeaveHeader
        onRequestClick={() => setRequestOpen(true)}
        monthLabel={monthLabel}
        dateLabel={`${now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} Ãƒâ€šÃ‚Â· Time-off requests, balances and coverage across all teams`}
        onExport={() => {
          exportToCsv("leave-requests", store.requests, [
            { key: "employeeName", label: "Employee" },
            { key: "type", label: "Type" },
            { key: "status", label: "Status" },
            { key: "startDate", label: "Start" },
            { key: "endDate", label: "End" },
            { key: "days", label: "Days" },
          ])
          notify.success("Leave exported", `${store.requests.length} requests downloaded as CSV.`)
        }}
      />
      <LeaveKpiStrip
        onLeaveToday={store.requests.filter((r) => r.status === "approved" && inRange(r, todayISO)).length}
        pending={pending.length}
        approvedThisMonth={store.requests.filter(
          (r) => r.status === "approved" && r.startDate.startsWith(monthPrefix),
        ).length}
        sickToday={store.requests.filter((r) => r.status === "approved" && r.type === "sick" && inRange(r, todayISO)).length}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4 overflow-clip rounded-lg border border-border bg-card p-4 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-h3">
                {monthLabel}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setMonthOffset((m) => m - 1)}
                  className="flex size-7 items-center justify-center rounded-lg border border-border bg-card"
                >
                  <ChevronLeft className="size-4 text-secondary-foreground" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setMonthOffset((m) => m + 1)}
                  className="flex size-7 items-center justify-center rounded-lg border border-border bg-card"
                >
                  <ChevronRight className="size-4 text-secondary-foreground" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {(["vac", "sick", "pers", "par"] as LeaveType[]).map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span className={cn("size-2 shrink-0 rounded-full", typeDot[t])} />
                  <span className="font-sans text-[11px] leading-normal text-secondary-foreground">
                    {leaveTypeLabel[t]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="flex justify-center">
                <span className="font-sans text-[10px] font-semibold uppercase leading-normal tracking-[0.25px] text-muted-foreground">
                  {day}
                </span>
              </div>
            ))}
            {cells.map((cell, idx) => {
              if (cell.day === null) {
                return (
                  <div
                    key={idx}
                    className="min-h-[64px] rounded-lg border border-border bg-muted p-[5px]"
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
                    "relative flex min-h-[64px] flex-col gap-[3px] rounded-lg border p-[5px] text-left",
                    isToday
                      ? "border-primary bg-foreground/10"
                      : "border-border bg-card hover:border-border",
                  )}
                >
                  <span
                    className={cn(
                      "font-sans text-[11px] font-medium leading-normal",
                      isToday ? "font-semibold text-secondary-foreground" : "text-muted-foreground",
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
                    <span className="font-sans text-[9px] font-semibold text-muted-foreground">
                      +{dayReqs.length - 2} more
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
          <PendingRequests
            requests={pending}
            onApprove={canManage ? onApprove : undefined}
            onDecline={canManage ? onDecline : undefined}
            onCancel={
              canManage
                ? undefined
                : (id) => {
                    const r = store.requests.find((x) => x.id === id)
                    if (r && isOwn(r)) handleCancelRequest(id)
                  }
            }
            onEdit={
              canManage
                ? undefined
                : (id) => {
                    const r = store.requests.find((x) => x.id === id)
                    if (r && isOwn(r) && r.status === "pending") setEditingRequest(r)
                  }
            }
          />
          <BalanceByType balances={store.balances[requester.id]} />
        </div>
      </div>

      <Sheet open={!!daySheetDate} onOpenChange={(o) => !o && setDaySheetDate(null)}>
        <SheetContent
          side="right"
          className="w-full gap-4 border-l border-border bg-card p-4 sm:max-w-[420px]"
        >
          <SheetHeader>
            <SheetTitle className="text-h4">
              {daySheetDate
                ? parseISODate(daySheetDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </SheetTitle>
            <SheetDescription className="font-sans text-[12.5px] text-muted-foreground">
              {dayRequests.length === 0
                ? "No leave scheduled."
                : `${dayRequests.length} on leave.`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2.5">
            {dayRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-[12.5px] text-muted-foreground">
                Quiet day. Nothing scheduled.
              </div>
            ) : (
              dayRequests.map((r) => {
                const s = pillStyles[r.type]
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-foreground/10">
                      <span className="font-sans text-[11px] font-semibold text-primary">
                        {r.initials}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-sans text-[12.5px] font-semibold text-foreground">
                        {r.employeeName}
                      </span>
                      <span className="font-sans text-[11px] text-muted-foreground">
                        {leaveTypeLabel[r.type]} Ãƒâ€šÃ‚Â· {r.reason}
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
        requester={requester}
        balances={store.balances[requester.id]}
        existing={store.requests}
        onSubmit={(req) => {
          setStore((prev) => ({
            ...prev,
            requests: [req, ...prev.requests],
          }))
          notify.success("Leave requested", `${req.employeeName}: ${req.days} day(s)`)

        }}
      />
      <RequestLeaveDialog
        open={!!editingRequest}
        onOpenChange={(o) => !o && setEditingRequest(null)}
        requester={requester}
        initial={editingRequest ?? undefined}
        balances={store.balances[requester.id]}
        existing={store.requests}
        onSubmit={handleSubmitEdit}
      />
    </>
  )
}

function RequestLeaveDialog({
  open,
  onOpenChange,
  requester,
  onSubmit,
  initial,
  balances,
  existing = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requester: { id: string; name: string; initials: string }
  onSubmit: (req: LeaveRequest) => void
  initial?: LeaveRequest
  balances?: { [key in "annual" | "sick" | "personal" | "parental"]: { used: number; total: number } }
  existing?: LeaveRequest[]
}) {
  const isEdit = !!initial
  const [submitting, setSubmitting] = React.useState(false)
  const [tomorrow] = React.useState(() => toISO(new Date(Date.now() + 86400_000)))
  const [plusTwo] = React.useState(() => toISO(new Date(Date.now() + 3 * 86400_000)))
  const form = useForm({
    type: initial ? (initial.type as string) : "vac",
    startDate: initial?.startDate ?? tomorrow,
    endDate: initial?.endDate ?? plusTwo,
    reason: initial?.reason ?? "",
    halfDay: initial?.halfDay ?? false,
  })
  const halfDay = form.values.halfDay

  // Always-mounted dialog: re-sync the form every time it opens so edits
  // pre-fill the selected request and cancelled drafts don't leak back in.
  React.useEffect(() => {
    if (!open) return
    form.reset({
      type: initial ? (initial.type as string) : "vac",
      startDate: initial?.startDate ?? tomorrow,
      endDate: initial?.endDate ?? plusTwo,
      reason: initial?.reason ?? "",
      halfDay: initial?.halfDay ?? false,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Live balance hint for the selected type.
  const bucket =
    ({ vac: "annual", sick: "sick", pers: "personal", par: "parental" } as const)[
      form.values.type as LeaveType
    ] ?? "annual"
  // Mirror the server's rule: outstanding pending requests of the same type
  // reserve balance too, otherwise the client accepts a request the API rejects.
  const pendingReserved = existing
    .filter(
      (r) =>
        r.id !== initial?.id &&
        r.employeeId === requester.id &&
        r.status === "pending" &&
        ({ vac: "annual", sick: "sick", pers: "personal", par: "parental" } as const)[r.type as LeaveType] === bucket,
    )
    .reduce((sum, r) => sum + (Number(r.days) || 0), 0)
  const remaining = balances
    ? (balances[bucket]?.total ?? 0) - (balances[bucket]?.used ?? 0) - pendingReserved
    : null

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
    const days = parsed.data.halfDay
      ? 0.5
      : (new Date(parsed.data.endDate).getTime() -
            new Date(parsed.data.startDate).getTime()) /
            86400_000 +
          1
    // A missing balance is not "0 days" ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â let the server validate and seed it.
    if (remaining !== null && remaining !== undefined && days > remaining) {
      notify.error(
        "Not enough balance",
        `You have ${Math.max(0, remaining)} ${bucket} day${remaining === 1 ? "" : "s"} remaining.`,
      )
      return
    }
    // Overlap guard against the signer's other live requests.
    const overlaps = existing.some(
      (r) =>
        r.id !== initial?.id &&
        r.employeeId === requester.id &&
        r.status !== "declined" &&
        parsed.data.startDate <= r.endDate &&
        r.startDate <= (parsed.data.halfDay ? parsed.data.startDate : parsed.data.endDate),
    )
    if (overlaps) {
      notify.error("Overlapping dates", "You already have a request that covers these dates.")
      form.setErrors({ startDate: "Overlaps an existing request" } as never)
      return
    }
    setSubmitting(true)
    try {
      const endDate = parsed.data.halfDay ? parsed.data.startDate : parsed.data.endDate
      onSubmit(
        isEdit && initial
          ? {
              ...initial,
              type: parsed.data.type as LeaveType,
              startDate: parsed.data.startDate,
              endDate,
              days,
              reason: parsed.data.reason,
              halfDay: parsed.data.halfDay || undefined,
            }
          : {
              id: `lr-${Math.random().toString(36).slice(2, 9)}`,
              employeeId: requester.id,
              employeeName: requester.name,
              initials: requester.initials,
              type: parsed.data.type as LeaveType,
              status: "pending",
              startDate: parsed.data.startDate,
              endDate,
              days,
              reason: parsed.data.reason,
              halfDay: parsed.data.halfDay || undefined,
            },
      )
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog width="wide"
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit leave request" : "Request leave"}
      description={
        isEdit
          ? "Update the details of your pending request."
          : "Your request will be sent to your manager for approval."
      }
      submitLabel={isEdit ? "Save changes" : "Submit request"}
      submitting={submitting}
      onSubmit={onConfirm}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        {remaining !== null ? (
          <label className="flex flex-col gap-[5px]">
            <span className="font-sans text-xs font-medium leading-normal text-muted-foreground">
              Remaining balance
            </span>
            <span className="flex h-9 items-center rounded-lg border border-border bg-muted px-3 font-sans text-[13.5px] text-secondary-foreground">
              {remaining} {bucket} day{remaining === 1 ? "" : "s"}
            </span>
          </label>
        ) : (
          <div />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Start"
          type="date"
          value={form.values.startDate}
          onChange={(v) => {
            form.setValue("startDate", v)
            if (halfDay) form.setValue("endDate", v)
          }}
          required
          error={form.errors.startDate}
        />
        <Field
          label="End"
          type="date"
          value={halfDay ? form.values.startDate : form.values.endDate}
          onChange={(v) => form.setValue("endDate", v)}
          required={!halfDay}
          disabled={halfDay}
          error={form.errors.endDate}
        />
      </div>
      <label htmlFor="leave-half-day" className="flex w-fit cursor-pointer items-center gap-2">
        <Checkbox
          id="leave-half-day"
          checked={halfDay}
          onCheckedChange={(checked) => {
            const isChecked = checked === true
            form.setValue("halfDay", isChecked)
            if (isChecked) form.setValue("endDate", form.values.startDate)
          }}
        />
        <span className="font-sans text-[13px] text-secondary-foreground">
          Half day (0.5 days)
        </span>
      </label>
      <TextArea
        label="Reason"
        value={form.values.reason}
        onChange={(v) => form.setValue("reason", v)}
        placeholder="Brief note for your manager"
        error={form.errors.reason}
      />
    </ActionDialog>
  )
}

function toISO(d: Date) {
  // Use UTC to match the server's date key ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â a local date can be a day off in
  // some timezones and would immediately undo an approved leave status.
  return d.toISOString().slice(0, 10)
}

// "YYYY-MM-DD" must be parsed as LOCAL time, not UTC, or the day shifts by one
// in negative-offset timezones.
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function inRange(r: LeaveRequest, iso: string) {
  return r.status !== "declined" && iso >= r.startDate && iso <= r.endDate
}
