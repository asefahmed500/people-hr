"use client"

import * as React from "react"
import { Users } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CheckIn, CheckInStatus } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const statuses: Record<
  CheckInStatus,
  { label: string; variant: "secondary" | "outline" | "ghost" }
> = {
  "on-time": { label: "On time", variant: "secondary" },
  late: { label: "Late", variant: "outline" },
  remote: { label: "Remote", variant: "ghost" },
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
    <div className="flex w-full flex-col overflow-clip rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-b-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <h2 className="font-sans inline-block text-sm font-semibold text-foreground">
            Live check-ins
          </h2>
          <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
        </div>
        <span className="font-sans inline-block text-xs text-muted-foreground">
          {updatedLabel ? `Updated ${updatedLabel}` : "Updating…"}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
          <p className="font-sans text-[13px] font-semibold text-foreground">No check-ins yet</p>
          <p className="font-sans text-[12px] text-muted-foreground">
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
        "flex items-center gap-4 px-4 py-3 transition-colors",
        !last && "border-b border-b-border",
        onSelect && "cursor-pointer hover:bg-muted",
      )}
    >
      <Avatar className="size-9">
        <AvatarFallback className="text-xs">{checkin.initials}</AvatarFallback>
      </Avatar>
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
      <Badge variant={s.variant} className="shrink-0">
        {s.label}
      </Badge>
    </div>
  )
}
