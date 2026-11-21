"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { AttendanceStore, Employee } from "@/lib/data"

type Row = {
  label: string
  count: string
  pct: string
  fillPct: number
  fillClass: string
}

// Each status keeps its own colour while sharing the Progress primitive.
const fillClasses = {
  present: "[&_[data-slot=progress-indicator]]:bg-primary",
  remote: "[&_[data-slot=progress-indicator]]:bg-secondary-foreground",
  leave: "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
  absent: "[&_[data-slot=progress-indicator]]:bg-foreground",
}

export function AttendanceCard({
  attendance,
  employees,
}: {
  attendance?: AttendanceStore
  employees?: Employee[]
}) {
  const checkIns = attendance?.checkIns ?? []
  const employeesList = employees ?? []
  const total = employeesList.length || checkIns.length || 1

  const onLeave = new Set(
    employeesList.filter((e) => e.status === "leave").map((e) => e.name),
  )
  const checkinByName = new Map(checkIns.map((c) => [c.name, c.status]))
  const present = employeesList.filter((e) => {
    const s = checkinByName.get(e.name)
    return !onLeave.has(e.name) && (s === "on-time" || s === "late")
  }).length
  const remote = employeesList.filter((e) => {
    const s = checkinByName.get(e.name)
    return !onLeave.has(e.name) && s === "remote"
  }).length
  const absent = Math.max(
    0,
    total - present - remote - onLeave.size,
  )

  const rows: Row[] = [
    {
      label: "Present",
      count: String(present),
      pct: `${Math.round((present / total) * 100)}%`,
      fillPct: Math.round((present / total) * 100),
      fillClass: fillClasses.present,
    },
    {
      label: "Remote",
      count: String(remote),
      pct: `${Math.round((remote / total) * 100)}%`,
      fillPct: Math.round((remote / total) * 100),
      fillClass: fillClasses.remote,
    },
    {
      label: "On leave",
      count: String(onLeave.size),
      pct: `${Math.round((onLeave.size / total) * 100)}%`,
      fillPct: Math.round((onLeave.size / total) * 100),
      fillClass: fillClasses.leave,
    },
    {
      label: "Absent",
      count: String(absent),
      pct: `${Math.round((absent / total) * 100)}%`,
      fillPct: Math.round((absent / total) * 100),
      fillClass: fillClasses.absent,
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
        Todayâ€™s attendance
      </h2>
      <div className="flex flex-col gap-3.5">
        {rows.map((row) => (
          <AttendanceRow key={row.label} row={row} />
        ))}
      </div>
    </div>
  )
}

function AttendanceRow({ row }: { row: Row }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-secondary-foreground">
          {row.label}
        </span>
        <span className="inline-block font-sans text-[12.5px] font-semibold leading-normal text-foreground">
          {row.count}
          <span className="ml-[3.125px] font-normal text-muted-foreground">
            Â· {row.pct}
          </span>
        </span>
      </div>
      <Progress
        value={row.fillPct}
        aria-label={`${row.label}: ${row.pct}`}
        className={cn("h-2", row.fillClass)}
      />
    </div>
  )
}
