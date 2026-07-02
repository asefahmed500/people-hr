"use client"

import { cn } from "@/lib/utils"
import type { LeaveRequest, LeaveStatus } from "@/lib/data"

const statusStyles: Record<
  LeaveStatus,
  { avatarBg: string; avatarText: string; pillBg: string; pillText: string; label: string }
> = {
  approved: {
    avatarBg: "bg-[#2f6f611a]",
    avatarText: "text-[#2f6f61]",
    pillBg: "bg-[#3bb27326]",
    pillText: "text-[#2e9160]",
    label: "Approved",
  },
  pending: {
    avatarBg: "bg-[#f4a26126]",
    avatarText: "text-[#b96a2c]",
    pillBg: "bg-[#f4a26126]",
    pillText: "text-[#b96a2c]",
    label: "Pending",
  },
  declined: {
    avatarBg: "bg-[#e76f5126]",
    avatarText: "text-[#c4553a]",
    pillBg: "bg-[#e76f5126]",
    pillText: "text-[#c4553a]",
    label: "Declined",
  },
}

export function PendingRequests({
  requests,
  onApprove,
  onDecline,
}: {
  requests: LeaveRequest[]
  onApprove?: (id: string) => void
  onDecline?: (id: string) => void
}) {
  const visible = requests.slice(0, 5)
  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-5 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
          Pending requests
        </h2>
        <span className="flex items-center rounded-full bg-[#f4a26126] px-2 py-[3px]">
          <span className="font-sans text-[10px] font-semibold leading-normal text-[#b96a2c]">
            {pendingCount} pending
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#edeae3] bg-[#faf9f6] px-4 py-6 text-center font-sans text-[12.5px] text-[#8a948d]">
            No leave requests.
          </div>
        ) : null}
        {visible.map((req) => (
          <RequestRow
            key={req.id}
            req={req}
            onApprove={onApprove}
            onDecline={onDecline}
          />
        ))}
      </div>
    </div>
  )
}

function RequestRow({
  req,
  onApprove,
  onDecline,
}: {
  req: LeaveRequest
  onApprove?: (id: string) => void
  onDecline?: (id: string) => void
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
        <span className="inline-block overflow-clip font-sans text-[13px] font-medium leading-normal text-[#1f2a26] [text-overflow:ellipsis]">
          {req.employeeName} · {req.days}d
        </span>
        <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
          {range}
        </span>
      </div>
      {req.status === "pending" && onApprove && onDecline ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Approve ${req.employeeName}`}
            onClick={() => onApprove(req.id)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#3bb2731f] text-[#2e9160] hover:bg-[#3bb2732e]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
              <path d="M5 12l5 5l10 -10" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`Decline ${req.employeeName}`}
            onClick={() => onDecline(req.id)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#e76f511f] text-[#c4553a] hover:bg-[#e76f512e]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
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
