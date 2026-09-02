"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { CheckIn, CheckInStatus } from "@/lib/data"

const statuses: Record<
  CheckInStatus,
  { label: string; pillBg: string; pillText: string; avatarBg: string; avatarText: string }
> = {
  "on-time": {
    label: "On time",
    pillBg: "bg-primary/10",
    pillText: "text-primary",
    avatarBg: "bg-foreground/10",
    avatarText: "text-primary",
  },
  late: {
    label: "Late",
    pillBg: "bg-secondary-foreground/10",
    pillText: "text-secondary-foreground",
    avatarBg: "bg-foreground/10",
    avatarText: "text-secondary-foreground",
  },
  remote: {
    label: "Remote",
    pillBg: "bg-muted-foreground/10",
    pillText: "text-muted-foreground",
    avatarBg: "bg-foreground/10",
    avatarText: "text-muted-foreground",
  },
}

type LiveCheckinsProps = {
  checkIns?: CheckIn[]
  onSelect?: (checkin: CheckIn) => void
}

function nowLabel() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
}

export function LiveCheckins({ checkIns, onSelect }: LiveCheckinsProps) {
  const [updatedLabel, setUpdatedLabel] = React.useState(() => nowLabel())
  React.useEffect(() => {
    const t = setInterval(() => setUpdatedLabel(nowLabel()), 60_000)
    return () => clearInterval(t)
  }, [])

  const items = checkIns ?? []
  return (
    <div className="flex w-full flex-col overflow-clip rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-b-border px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="size-2.5 shrink-0 rounded-full bg-primary" />
          <h2 className="font-sans inline-block text-sm font-semibold text-foreground">
            Live check-ins
          </h2>
          <span className="rounded-full bg-foreground/10 px-2 py-[3px] font-sans text-[10px] font-semibold leading-normal text-secondary-foreground">
            {items.length}
          </span>
        </div>
        <span className="font-sans inline-block text-xs text-muted-foreground">
          {updatedLabel ? `Updated ${updatedLabel}` : "Updating…"}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-sans text-[13px] font-medium text-foreground">No check-ins yet</p>
          <p className="mt-1 font-sans text-[12px] text-muted-foreground">
            Mark attendance to see today’s live list here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((checkin, idx) => (
            <CheckinRow
              key={checkin.id ?? checkin.initials + checkin.time}
              checkin={checkin}
              last={idx === items.length - 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CheckinRow({
  checkin,
  last,
  onSelect,
}: {
  checkin: CheckIn
  last: boolean
  onSelect?: (checkin: CheckIn) => void
}) {
  const s = statuses[checkin.status]
  return (
    <div
      onClick={onSelect ? () => onSelect(checkin) : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(checkin) } } : undefined}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      className={cn(
        "flex items-center gap-4 px-6 py-3.5 transition-colors",
        !last && "border-b border-b-border",
        onSelect && "cursor-pointer hover:bg-muted",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          s.avatarBg,
        )}
      >
        <span
          className={cn(
            "font-sans text-xs font-semibold",
            s.avatarText,
          )}
        >
          {checkin.initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-sans inline-block text-sm font-semibold text-foreground">
          {checkin.name}
        </span>
        <span className="font-sans inline-block text-xs text-muted-foreground">
          {checkin.dept}
        </span>
      </div>
      <span className="shrink-0 font-sans text-xs text-secondary-foreground">
        {checkin.time}
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center rounded-full px-2.5 py-1 font-sans text-xs font-medium",
          s.pillBg,
          s.pillText,
        )}
      >
        {s.label}
      </span>
    </div>
  )
}
