"use client"

import { Check, Ellipsis, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { LeaveRequest, LeaveStatus } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const statusStyles: Record<
  LeaveStatus,
  { avatarBg: string; avatarText: string; pillBg: string; pillText: string; label: string }
> = {
  approved: {
    avatarBg: "bg-foreground/10",
    avatarText: "text-primary",
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    label: "Approved",
  },
  pending: {
    avatarBg: "bg-foreground/10",
    avatarText: "text-secondary-foreground",
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    label: "Pending",
  },
  declined: {
    avatarBg: "bg-foreground/10",
    avatarText: "text-foreground",
    pillBg: "bg-foreground/10",
    pillText: "text-foreground",
    label: "Declined",
  },
}

export function PendingRequests({
  requests,
  onApprove,
  onDecline,
  onCancel,
  onEdit,
}: {
  requests: LeaveRequest[]
  onApprove?: (id: string) => void
  onDecline?: (id: string) => void
  onCancel?: (id: string) => void
  onEdit?: (id: string) => void
}) {
  const visible = requests.slice(0, 5)
  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-h4">
          Pending requests
        </h2>
        <span className="flex items-center rounded-full bg-foreground/10 px-2 py-[3px]">
          <span className="font-sans text-[10px] font-semibold leading-normal text-secondary-foreground">
            {pendingCount} pending
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-[12.5px] text-muted-foreground">
            No leave requests.
          </div>
        ) : null}
        {visible.map((req) => (
          <RequestRow
            key={req.id}
            req={req}
            onApprove={onApprove}
            onDecline={onDecline}
            onCancel={onCancel}
            onEdit={onEdit}
          />
        ))}
        {requests.length > visible.length ? (
          <span className="text-center font-sans text-[11px] text-muted-foreground">
            +{requests.length - visible.length} more pending
          </span>
        ) : null}
      </div>
    </div>
  )
}

function RequestRow({
  req,
  onApprove,
  onDecline,
  onCancel,
  onEdit,
}: {
  req: LeaveRequest
  onApprove?: (id: string) => void
  onDecline?: (id: string) => void
  onCancel?: (id: string) => void
  onEdit?: (id: string) => void
}) {
  const s = statusStyles[req.status]
  const range =
    req.startDate === req.endDate
      ? req.startDate
      : `${req.startDate} → ${req.endDate}`
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          s.avatarBg,
        )}
      >
        <span className={cn("font-sans text-[11px] font-semibold", s.avatarText)}>
          {req.initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="inline-block overflow-clip font-sans text-[13px] font-medium leading-normal text-foreground [text-overflow:ellipsis]">
          {req.employeeName} · {req.days}d
        </span>
        <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
          {range}
        </span>
      </div>
      {req.status === "pending" && onApprove && onDecline ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Approve ${req.employeeName}`}
            onClick={() => onApprove(req.id)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/10 text-secondary-foreground hover:bg-foreground/20"
          >
            <Check className="size-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={`Decline ${req.employeeName}`}
            onClick={() => onDecline(req.id)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/10 text-foreground hover:bg-foreground/20"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      ) : req.status === "pending" && (onCancel || onEdit) ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Manage your ${req.employeeName} request`}
              className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/10 text-secondary-foreground hover:bg-foreground/20"
            >
              <Ellipsis className="size-3.5" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(req.id)}>Edit request</DropdownMenuItem>
            ) : null}
            {onCancel ? (
              <DropdownMenuItem
                className="text-foreground focus:text-foreground"
                onClick={() => onCancel(req.id)}
              >
                Cancel request
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span
          className={cn(
            "flex shrink-0 items-center rounded-full px-2 py-[3px] font-sans text-[10px] font-semibold leading-normal",
            s.pillBg,
            s.pillText,
          )}
        >
          {s.label}
        </span>
      )}
    </div>
  )
}
