"use client"

import type { AttendanceStore, Employee } from "@/lib/data"

type Row = {
  label: string
  count: string
  pct: string
  fillPct: number
  fill: string
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
      fill: "bg-primary",
    },
    {
      label: "Remote",
      count: String(remote),
      pct: `${Math.round((remote / total) * 100)}%`,
      fillPct: Math.round((remote / total) * 100),
      fill: "bg-secondary-foreground",
    },
    {
      label: "On leave",
      count: String(onLeave.size),
      pct: `${Math.round((onLeave.size / total) * 100)}%`,
      fillPct: Math.round((onLeave.size / total) * 100),
      fill: "bg-muted-foreground",
    },
    {
      label: "Absent",
      count: String(absent),
      pct: `${Math.round((absent / total) * 100)}%`,
      fillPct: Math.round((absent / total) * 100),
      fill: "bg-foreground",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-border bg-card p-[22px] shadow-card">
      <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
        Today’s attendance
      </h3>
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
            · {row.pct}
          </span>
        </span>
      </div>
      <div className="flex h-2 w-full overflow-clip rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${row.fill}`}
          style={{ width: `${row.fillPct}%` }}
        />
      </div>
    </div>
  )
}
