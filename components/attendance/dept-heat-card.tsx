"use client"

import { cn } from "@/lib/utils"
import type { CheckIn } from "@/lib/data"

export function DeptHeatCard({ checkIns = [] }: { checkIns?: CheckIn[] }) {
  const byDept = new Map<string, CheckIn[]>()
  for (const c of checkIns) {
    const list = byDept.get(c.dept) ?? []
    list.push(c)
    byDept.set(c.dept, list)
  }

  const tiles = [...byDept.entries()].map(([dept, list]) => {
    const onTime = list.filter((c) => c.status === "on-time").length
    const pct = Math.round((onTime / list.length) * 100)
    return {
      dept,
      pct: `${pct}%`,
      tileBg: "bg-foreground/10",
      pctColor: pct >= 90 ? "text-primary" : "text-secondary-foreground",
      count: list.length,
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-sans inline-block text-sm font-semibold text-foreground">
          Attendance by department
        </h2>
        <span className="font-sans inline-block text-xs text-muted-foreground">
          on-time rate
        </span>
      </div>
      {tiles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-xs text-muted-foreground">
          No check-ins to break down yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tiles.map((tile) => (
            <div
              key={tile.dept}
              className={cn(
                "flex min-w-[150px] flex-1 flex-col gap-1 rounded-xl p-4",
                tile.tileBg,
              )}
            >
              <span className="font-sans inline-block text-xs text-secondary-foreground">
                {tile.dept}
              </span>
              <span
                className={cn(
                  "inline-block text-[28px] font-semibold leading-tight",
                  tile.pctColor,
                )}
              >
                {tile.pct}
              </span>
              <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
                {tile.count} check-in{tile.count === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
