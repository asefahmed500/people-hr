"use client"

import type { Employee } from "@/lib/data"

export function RecentHires({
  employees,
  onViewAll,
}: {
  employees?: Employee[]
  onViewAll?: () => void
}) {
  const recent =
    employees
      ?.slice()
      .sort((a, b) => a.hiredDaysAgo - b.hiredDaysAgo)
      .slice(0, 3) ?? []

  return (
    <div className="flex flex-1 flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px] shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
          Recent hires
        </h3>
        {onViewAll ? (
          <button type="button" onClick={onViewAll} className="font-sans inline-block text-xs font-semibold leading-normal text-primary hover:text-foreground">
            View all
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-[12.5px] text-muted-foreground">
            No recent hires.
          </p>
        ) : (
          recent.map((hire) => (
            <HireRow key={hire.id} hire={hire} />
          ))
        )}
      </div>
    </div>
  )
}

function HireRow({ hire }: { hire: Employee }) {
  const dateLabel = hire.hiredDaysAgo === 0 ? "Today" : `${hire.hiredDaysAgo}d ago`
  return (
    <div className="flex items-center gap-[11px]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 font-sans text-[11px] font-semibold text-primary">
        {hire.initials}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="inline-block overflow-clip font-sans text-[13px] font-semibold leading-normal text-foreground [text-overflow:ellipsis]">
          {hire.name}
        </span>
        <span className="inline-block overflow-clip font-sans text-[11.5px] leading-normal text-muted-foreground [text-overflow:ellipsis]">
          {hire.role}
        </span>
      </div>
      <span className="shrink-0 font-sans text-[11px] leading-normal text-muted-foreground">
        {dateLabel}
      </span>
    </div>
  )
}
