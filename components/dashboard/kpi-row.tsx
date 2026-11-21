"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Inbox,
  UserSearch,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AttendanceStore, Employee } from "@/lib/data"

type Tone = "forest" | "amber" | "coral"

type Kpi = {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: string
  label: string
  delta: string
  deltaTone: Tone
  deltaDirection: "up" | "down"
}

const deltaStyles: Record<Tone, { icon: string; text: string }> = {
  forest: {
    icon: "text-secondary-foreground",
    text: "text-secondary-foreground",
  },
  amber: {
    icon: "text-secondary-foreground",
    text: "text-secondary-foreground",
  },
  coral: {
    icon: "text-foreground",
    text: "text-foreground",
  },
}

export function KpiRow({
  employees = [],
  attendance,
  pendingLeave = 0,
  openRoles = 0,
  interviews = 0,
}: {
  employees?: Employee[]
  attendance?: AttendanceStore
  pendingLeave?: number
  openRoles?: number
  interviews?: number
}) {
  const total = employees.length
  const onLeave = new Set(
    employees.filter((e) => e.status === "leave").map((e) => e.name),
  )
  const checkinByName = new Map(
    (attendance?.checkIns ?? []).map((c) => [c.name, c.status]),
  )
  const present = employees.filter((e) => {
    const s = checkinByName.get(e.name)
    return !onLeave.has(e.name) && (s === "on-time" || s === "late")
  }).length
  const remote = employees.filter((e) => {
    const s = checkinByName.get(e.name)
    return !onLeave.has(e.name) && s === "remote"
  }).length
  const checkedIn = present + remote
  const presentPct = total > 0 ? Math.round((checkedIn / total) * 1000) / 10 : 0
  const newThisWeek = employees.filter((e) => e.hiredDaysAgo <= 7).length

  const derived: Kpi[] = [
    {
      icon: Users,
      iconBg: "bg-foreground/10",
      iconColor: "text-primary",
      value: total > 0 ? total.toLocaleString() : "0",
      label: "Total headcount",
      delta: `${newThisWeek} new this week`,
      deltaTone: "forest",
      deltaDirection: "up",
    },
    {
      icon: CalendarClock,
      iconBg: "bg-foreground/10",
      iconColor: "text-secondary-foreground",
      value: `${presentPct}%`,
      label: "Present today",
      delta: `${checkedIn}/${total} checked in`,
      deltaTone: "forest",
      deltaDirection: "up",
    },
    {
      icon: UserSearch,
      iconBg: "bg-foreground/10",
      iconColor: "text-secondary-foreground",
      value: String(openRoles),
      label: "Open positions",
      delta: `${interviews} in interview`,
      deltaTone: "amber",
      deltaDirection: "up",
    },
    {
      icon: Inbox,
      iconBg: "bg-foreground/10",
      iconColor: "text-secondary-foreground",
      value: String(pendingLeave),
      label: "Leave to approve",
      delta: "pending requests",
      deltaTone: "coral",
      deltaDirection: "down",
    },
  ]

  return (
    <div className="grid h-fit w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {derived.map((kpi, idx) => (
        <KpiCard key={idx} kpi={kpi} />
      ))}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon
  const DeltaIcon = kpi.deltaDirection === "up" ? ArrowUpRight : ArrowDownRight
  const delta = deltaStyles[kpi.deltaTone]
  return (
    <div className="flex flex-1 flex-col gap-3.5 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-[38px] items-center justify-center rounded-lg",
            kpi.iconBg,
          )}
        >
          <Icon className={cn("size-[19px]", kpi.iconColor)} strokeWidth={2} aria-hidden="true" />
        </div>
        <Badge
          variant="secondary"
          className={cn("gap-[3px] bg-foreground/10 px-[7px] py-0 font-sans", delta.text)}
        >
          <DeltaIcon className={cn("size-3", delta.icon)} strokeWidth={2} aria-hidden="true" />
          <span className="text-[11px] font-semibold leading-normal">{kpi.delta}</span>
        </Badge>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-stat">
          {kpi.value}
        </div>
        <div className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
          {kpi.label}
        </div>
      </div>
    </div>
  )
}
