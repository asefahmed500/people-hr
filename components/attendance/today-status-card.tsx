"use client"

import { ClipboardList } from "lucide-react"

import type { CheckIn } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

type LegendItem = {
  dot: string
  label: string
  value: string
}

export function TodayStatusCard({ checkIns = [] }: { checkIns?: CheckIn[] }) {
  const total = checkIns.length
  const onSite = checkIns.filter((c) => c.status === "on-time").length
  const late = checkIns.filter((c) => c.status === "late").length
  const remote = checkIns.filter((c) => c.status === "remote").length
  const present = onSite + late

  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "0%")

  const legend: LegendItem[] = [
    { dot: "bg-primary", label: "On-site present", value: `${onSite} · ${pct(onSite)}` },
    { dot: "bg-secondary-foreground", label: "Arrived late", value: `${late} · ${pct(late)}` },
    { dot: "bg-muted-foreground", label: "Remote connected", value: `${remote} · ${pct(remote)}` },
  ]

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4 lg:w-[380px] lg:shrink-0">
      <h2 className="text-h4">
        Today&apos;s status
      </h2>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted p-4">
        <Badge variant="outline" className="gap-2 border-border bg-card px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-secondary-foreground">
          <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
          Live check-ins
        </Badge>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-stat">
            {present}
          </span>
          <span className="font-sans inline-block text-[10px] uppercase leading-normal tracking-[0.5px] text-muted-foreground">
            Present Today
          </span>
        </div>
      </div>
      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-6 text-center">
          <ClipboardList className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
          <p className="font-sans text-[13px] font-semibold text-foreground">No check-ins recorded today</p>
          <p className="font-sans text-xs text-muted-foreground">They&apos;ll appear here as people arrive.</p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-3 border-t border-t-border px-0 pb-0 pt-4">
          {legend.map((item) => (
            <div key={item.label} className="flex w-full items-center">
              <span className={`size-2 shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
              <div className="mx-0 my-0 ml-2 flex flex-1 items-center justify-between">
                <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
                  {item.label}
                </span>
                <span className="font-sans text-xs font-semibold text-foreground">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
