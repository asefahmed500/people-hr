"use client"

import type { CheckIn } from "@/lib/data"

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
    { dot: "bg-background", label: "On-site present", value: `${onSite} · ${pct(onSite)}` },
    { dot: "bg-secondary-foreground", label: "Arrived late", value: `${late} · ${pct(late)}` },
    { dot: "bg-muted-foreground", label: "Remote connected", value: `${remote} · ${pct(remote)}` },
  ]

  return (
    <div className="flex w-[380px] shrink-0 flex-col gap-5 rounded-2xl border border-foreground bg-foreground p-6 shadow-xl">
      <h2 className="font-sans inline-block text-sm font-semibold text-background">
        Today’s status
      </h2>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-foreground bg-foreground p-4">
        <div className="flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/10 px-3 py-1.5">
          <span className="size-2.5 rounded-full bg-background" />
          <span className="font-sans text-[11px] font-semibold uppercase leading-normal tracking-[0.55px] text-background/80">
            Live check-ins
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-stat text-background">
            {present}
          </span>
          <span className="font-sans inline-block text-[10px] uppercase leading-normal tracking-[0.5px] text-muted-foreground">
            Present Today
          </span>
        </div>
      </div>
      {total === 0 ? (
        <p className="rounded-xl border border-foreground/20 bg-foreground/10 px-4 py-6 text-center font-sans text-xs text-background/60">
          No check-ins recorded today yet.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-3 border-t border-t-foreground px-0 pb-0 pt-4">
          {legend.map((item) => (
            <div key={item.label} className="flex w-full items-center">
              <span className={`size-2 shrink-0 rounded-full ${item.dot}`} />
              <div className="mx-0 my-0 ml-2 flex flex-1 items-center justify-between">
                <span className="font-sans inline-block text-xs leading-normal text-background/60">
                  {item.label}
                </span>
                <span className="font-sans text-xs font-semibold text-background">
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
