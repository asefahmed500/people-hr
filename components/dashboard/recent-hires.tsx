"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
    <div className="flex flex-1 flex-col gap-3.5 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
          Recent hires
        </h2>
        {onViewAll ? (
          <Button type="button" variant="link" size="xs" onClick={onViewAll} className="text-xs">
            View all
          </Button>
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
      <Avatar className="size-9 bg-foreground/10">
        <AvatarFallback className="bg-transparent font-sans text-[11px] font-semibold text-primary">
          {hire.initials}
        </AvatarFallback>
      </Avatar>
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
