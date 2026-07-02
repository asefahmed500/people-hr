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
    <div className="flex flex-1 flex-col gap-3.5 rounded-[18px] border border-[#ece9e2] bg-white p-[22px] shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <div className="flex items-center justify-between">
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
          Recent hires
        </h3>
        <button type="button" onClick={onViewAll} className="font-sans inline-block text-xs font-semibold leading-normal text-[#2f6f61] hover:text-[#1f4f43]">
          View all
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {recent.map((hire) => (
          <HireRow key={hire.id} hire={hire} />
        ))}
      </div>
    </div>
  )
}

function HireRow({ hire }: { hire: Employee }) {
  const dateLabel = hire.hiredDaysAgo === 0 ? "Today" : `${hire.hiredDaysAgo}d ago`
  return (
    <div className="flex items-center gap-[11px]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2f6f611a] font-sans text-[11px] font-semibold text-[#2f6f61]">
        {hire.initials}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="inline-block overflow-clip font-sans text-[13px] font-semibold leading-normal text-[#1f2a26] [text-overflow:ellipsis]">
          {hire.name}
        </span>
        <span className="inline-block overflow-clip font-sans text-[11.5px] leading-normal text-[#8a948d] [text-overflow:ellipsis]">
          {hire.role}
        </span>
      </div>
      <span className="shrink-0 font-sans text-[11px] leading-normal text-[#a6aca3]">
        {dateLabel}
      </span>
    </div>
  )
}
