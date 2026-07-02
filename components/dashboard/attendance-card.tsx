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
  const total = employees?.length ?? (checkIns.length || 1)

  const onTime = checkIns.filter((c) => c.status === "on-time").length
  const late = checkIns.filter((c) => c.status === "late").length
  const remote = checkIns.filter((c) => c.status === "remote").length
  const onLeave =
    employees?.filter((e) => e.status === "leave").length ?? 0
  const present = onTime + late
  const absent = total - present - remote - onLeave

  const rows: Row[] = [
    {
      label: "Present",
      count: String(present),
      pct: `${Math.round((present / total) * 100)}%`,
      fillPct: Math.round((present / total) * 100),
      fill: "bg-[#2f6f61]",
    },
    {
      label: "Remote",
      count: String(remote),
      pct: `${Math.round((remote / total) * 100)}%`,
      fillPct: Math.round((remote / total) * 100),
      fill: "bg-[#64b6ac]",
    },
    {
      label: "On leave",
      count: String(onLeave),
      pct: `${Math.round((onLeave / total) * 100)}%`,
      fillPct: Math.round((onLeave / total) * 100),
      fill: "bg-[#f4a261]",
    },
    {
      label: "Absent",
      count: String(absent),
      pct: `${Math.round((absent / total) * 100)}%`,
      fillPct: Math.round((absent / total) * 100),
      fill: "bg-[#e76f51]",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[18px] border border-[#ece9e2] bg-white p-[22px] shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
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
        <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-[#5b655e]">
          {row.label}
        </span>
        <span className="inline-block font-sans text-[12.5px] font-semibold leading-normal text-[#1f2a26]">
          {row.count}
          <span className="ml-[3.125px] font-normal text-[#a6aca3]">
            · {row.pct}
          </span>
        </span>
      </div>
      <div className="flex h-2 w-full overflow-clip rounded-full bg-[#f1efe9]">
        <div
          className={`h-full rounded-full ${row.fill}`}
          style={{ width: `${row.fillPct}%` }}
        />
      </div>
    </div>
  )
}
