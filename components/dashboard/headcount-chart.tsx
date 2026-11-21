"use client"

import type { Employee } from "@/lib/data"

type Month = {
  label: string
  hires: number
  current?: boolean
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86400_000)
}

export function HeadcountChart({ employees }: { employees?: Employee[] }) {
  const empData = employees ?? []

  const now = new Date()
  const months: Month[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const fromDays = daysBetween(start, now)
    // Current month includes people hired today (hiredDaysAgo = 0), so use -1.
    const toDays = i === 0 ? -1 : daysBetween(end, now)
    months.push({
      label: MONTH_NAMES[start.getMonth()],
      hires: empData.filter((e) => e.hiredDaysAgo > toDays && e.hiredDaysAgo <= fromDays).length,
      current: i === 0,
    })
  }

  const max = Math.max(1, ...months.map((m) => m.hires))
  const total = empData.length
  const avgYrs = total > 0
    ? `${(empData.reduce((s, e) => s + e.hiredDaysAgo, 0) / total / 365).toFixed(1)} yrs`
    : "0.0 yrs"
  const active = empData.filter((e) => e.status !== "leave" && e.status !== "inactive").length
  const departed = empData.filter((e) => e.status === "inactive").length
  const retention = total > 0 ? `${Math.round((active / total) * 1000) / 10}%` : "â€”"
  const netYTD = total - departed

  return (
    <div className="relative flex flex-1 flex-col gap-5 rounded-lg border border-border bg-card p-4">
      <Header />
      <Plot months={months} max={max} />
      <Footer netYTD={netYTD} retention={retention} avgYrs={avgYrs} />
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-[3px]">
        <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
          Headcount growth
        </h2>
        <p className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
          Hires over the last 12 months
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Legend color="bg-primary" label="Hires" />
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`size-[9px] rounded-[3px] ${color}`} />
      <span className="font-sans inline-block text-xs leading-normal text-secondary-foreground">
        {label}
      </span>
    </div>
  )
}

function Plot({ months, max }: { months: Month[]; max: number }) {
  return (
    <div className="flex h-[210px] items-end justify-between gap-2.5 border-b border-b-border pb-0 pt-2.5">
      {months.map((m) => {
        const hireH = Math.round((m.hires / max) * 170)
        return (
          <div
            key={m.label}
            className="flex h-full flex-1 flex-col items-end justify-end gap-2"
          >
            <div className="flex w-full max-w-6 flex-col justify-end">
              <div
                className={`flex w-full flex-col rounded-tl-[5px] rounded-tr-[5px] rounded-bl-[5px] rounded-br-[5px] ${
                  m.current ? "bg-primary" : "bg-secondary-foreground"
                }`}
                style={{ height: `${hireH}px` }}
              />
            </div>
            <span
              className={`font-sans inline-block text-[10.5px] leading-normal ${
                m.current
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {m.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Footer({
  netYTD,
  retention,
  avgYrs,
}: {
  netYTD: number
  retention: string
  avgYrs: string
}) {
  return (
    <div className="flex items-center gap-6 pb-0 pt-0.5">
      <Stat value={netYTD > 0 ? `+${netYTD}` : String(netYTD)} label="Net YTD" />
      <Stat value={retention} label="Retention" />
      <Stat value={avgYrs} label="Avg tenure" />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-h3">
        {value}
      </span>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
        {label}
      </span>
    </div>
  )
}