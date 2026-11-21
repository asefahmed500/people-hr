"use client"

import { Check, Ellipsis, Inbox, X } from "lucide-react"

import type { LeaveRequest, LeaveStatus } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const statusStyles: Record<
  LeaveStatus,
  { variant: "secondary" | "outline" | "destructive"; label: string }
> = {
  approved: { variant: "secondary", label: "Approved" },
  pending: { variant: "outline", label: "Pending" },
  declined: { variant: "destructive", label: "Declined" },
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
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h4">
          Pending requests
        </h2>
        <Badge variant="secondary" className="text-[10px] font-semibold">
          {pendingCount} pending
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center">
            <Inbox className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
            <p className="font-sans text-[13px] font-semibold text-foreground">No leave requests</p>
            <p className="font-sans text-[12.5px] text-muted-foreground">New requests will show up here.</p>
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
      <Avatar className="size-8">
        <AvatarFallback className="text-[11px] font-semibold">{req.initials}</AvatarFallback>
      </Avatar>
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
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            aria-label={`Approve ${req.employeeName}`}
            onClick={() => onApprove(req.id)}
          >
            <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label={`Decline ${req.employeeName}`}
            onClick={() => onDecline(req.id)}
          >
            <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      ) : req.status === "pending" && (onCancel || onEdit) ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon-xs"
              aria-label={`Manage your ${req.employeeName} request`}
            >
              <Ellipsis className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </Button>
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
        <Badge variant={s.variant} className="shrink-0 text-[10px] font-semibold">
          {s.label}
        </Badge>
      )}
    </div>
  )
}
