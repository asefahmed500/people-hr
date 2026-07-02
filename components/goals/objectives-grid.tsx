import type { Objective as ObjectiveType } from "@/lib/data"
import { cn } from "@/lib/utils"

const statusStyles: Record<
  ObjectiveType["status"],
  { dot: string; pillBg: string; pillText: string; label: string; bar: string }
> = {
  "on-track": {
    dot: "bg-[#2f6f61]",
    pillBg: "bg-[#2f6f611a]",
    pillText: "text-[#2f6f61]",
    label: "On track",
    bar: "bg-[#2f6f61]",
  },
  "at-risk": {
    dot: "bg-[#d98a2b]",
    pillBg: "bg-[#d98a2b1a]",
    pillText: "text-[#b26a1f]",
    label: "At risk",
    bar: "bg-[#d98a2b]",
  },
  completed: {
    dot: "bg-[#2e9160]",
    pillBg: "bg-[#3bb27326]",
    pillText: "text-[#2e9160]",
    label: "Completed",
    bar: "bg-[#2e9160]",
  },
}

export function ObjectivesGrid({
  objectives,
  onToggleKr,
}: {
  objectives: ObjectiveType[]
  onToggleKr?: (objId: string, krIdx: number) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-5">
      {objectives.map((obj) => (
        <ObjectiveCard key={obj.id} obj={obj} onToggleKr={onToggleKr} />
      ))}
    </div>
  )
}

function ObjectiveCard({
  obj,
  onToggleKr,
}: {
  obj: ObjectiveType
  onToggleKr?: (objId: string, krIdx: number) => void
}) {
  const s = statusStyles[obj.status]
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-5 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex flex-col gap-2">
        <span className="font-sans inline-block text-[11px] font-bold uppercase leading-normal tracking-[0.6px] text-[#8a948d]">
          {obj.eyebrow}
        </span>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-sans inline-block text-[15px] font-semibold leading-tight text-[#1f2a26]">
            {obj.title}
          </h3>
          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold leading-normal",
              s.pillBg,
              s.pillText,
            )}
          >
            <span className={`size-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2f6f611a]">
          <span className="font-sans text-[11px] font-semibold leading-normal text-[#2f6f61]">
            {obj.ownerInit}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-sans inline-block overflow-clip text-[12.5px] font-semibold leading-normal text-[#1f2a26] [text-overflow:ellipsis]">
            {obj.ownerName}
          </span>
          <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
            {obj.ownerRole}
          </span>
        </div>
        <span className="ml-auto font-display text-[22px] font-semibold leading-none text-[#1f2a26]">
          {obj.progress}%
        </span>
      </div>
      <div className="flex h-1.5 w-full overflow-clip rounded-full bg-[#f1eee8]">
        <div
          className={cn("h-full rounded-full", s.bar)}
          style={{ width: `${obj.progress}%` }}
        />
      </div>
      <div className="flex flex-col gap-2.5 border-t border-t-[#f1eee8] pt-3">
        {obj.krs.map((kr, idx) => (
          <button
            key={kr.id}
            type="button"
            onClick={() => onToggleKr?.(obj.id, idx)}
            className="flex flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans inline-block text-[12.5px] leading-normal text-[#5b655e]">
                {kr.label}
              </span>
              <span className="font-sans inline-block text-[11px] font-semibold leading-normal text-[#42504a]">
                {kr.pct}%
              </span>
            </div>
            <div className="flex h-1 w-full overflow-clip rounded-full bg-[#f1eee8]">
              <div
                className={cn("h-full rounded-full", kr.pct >= 100 ? s.bar : s.bar)}
                style={{ width: `${kr.pct}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
