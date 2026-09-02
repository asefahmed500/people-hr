"use client"

import { AlertCircle, Check, Timer, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CheckIn } from "@/lib/data"

type Kpi = {
  label: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: string
  delta: string
  deltaColor: string
}

function pctOf(part: number, total: number) {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "0%"
}

export function AttendanceKpis({ checkIns = [] }: { checkIns?: CheckIn[] }) {
  const total = checkIns.length
  const onTime = checkIns.filter((c) => c.status === "on-time").length
  const late = checkIns.filter((c) => c.status === "late").length
  const remote = checkIns.filter((c) => c.status === "remote").length
  const present = onTime + late

  const kpis: Kpi[] = [
    {
      label: "Present",
      icon: Check,
      iconBg: "bg-foreground/10",
      iconColor: "text-primary",
      value: `${present}`,
      delta: `${pctOf(present, total)} of check-ins`,
      deltaColor: "text-secondary-foreground",
    },
    {
      label: "On-time",
      icon: Timer,
      iconBg: "bg-foreground/10",
      iconColor: "text-secondary-foreground",
      value: `${onTime}`,
      delta: `${pctOf(onTime, total)} of check-ins`,
      deltaColor: "text-secondary-foreground",
    },
    {
      label: "Late",
      icon: AlertCircle,
      iconBg: "bg-foreground/10",
      iconColor: "text-foreground",
      value: `${late}`,
      delta: `${pctOf(late, total)} of check-ins`,
      deltaColor: "text-muted-foreground",
    },
    {
      label: "Remote",
      icon: Check,
      iconBg: "bg-foreground/10",
      iconColor: "text-muted-foreground",
      value: `${remote}`,
      delta: `${pctOf(remote, total)} of check-ins`,
      deltaColor: "text-muted-foreground",
    },
  ]

  return (
    <div className="flex gap-5">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-sans inline-block text-xs text-muted-foreground">
          {kpi.label}
        </span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            kpi.iconBg,
          )}
        >
          <Icon
            className={cn("size-4", kpi.iconColor)}
            strokeWidth={2}
          />
        </div>
      </div>
      <span className="text-stat">
        {kpi.value}
      </span>
      <span
        className={cn("font-sans inline-block text-xs", kpi.deltaColor)}
      >
        {kpi.delta}
      </span>
    </div>
  )
}
