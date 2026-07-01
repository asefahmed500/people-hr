import { cn } from "@/lib/utils"

type Status = "on-track" | "at-risk" | "completed"

type KeyResult = {
  label: string
  pct: number
}

type Objective = {
  eyebrow: string
  title: string
  ownerInit: string
  ownerName: string
  ownerRole: string
  progress: number
  status: Status
  krs: KeyResult[]
}

const statusStyles: Record<
  Status,
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

const objectives: Objective[] = [
  {
    eyebrow: "Company OKR · Revenue",
    title: "Grow ARR to $24M",
    ownerInit: "MB",
    ownerName: "Marcus Bailey",
    ownerRole: "Chief Revenue Officer",
    progress: 72,
    status: "on-track",
    krs: [
      { label: "Close $6.2M new logo", pct: 81 },
      { label: "Expansion ARR $3.4M", pct: 64 },
      { label: "Net retention 118%", pct: 70 },
    ],
  },
  {
    eyebrow: "Company OKR · Product",
    title: "Ship Aurora Checkout 2.0",
    ownerInit: "HL",
    ownerName: "Hana Lindqvist",
    ownerRole: "Chief Product Officer",
    progress: 86,
    status: "on-track",
    krs: [
      { label: "Beta with 20 customers", pct: 100 },
      { label: "GA launch by Mar 14", pct: 92 },
      { label: "NPS +8 points", pct: 66 },
    ],
  },
  {
    eyebrow: "Company OKR · Engineering",
    title: "Reduce P95 latency to 180ms",
    ownerInit: "DO",
    ownerName: "Daniel Okafor",
    ownerRole: "VP Engineering",
    progress: 42,
    status: "at-risk",
    krs: [
      { label: "Cache layer rollout", pct: 64 },
      { label: "Query optimization", pct: 38 },
      { label: "Region edge nodes", pct: 24 },
    ],
  },
  {
    eyebrow: "Company OKR · People",
    title: "Lift engagement to 8.4",
    ownerInit: "LF",
    ownerName: "Lena Fischer",
    ownerRole: "Director of People",
    progress: 100,
    status: "completed",
    krs: [
      { label: "Engagement survey complete", pct: 100 },
      { label: "Manager training 95%", pct: 100 },
      { label: "Recognition program live", pct: 100 },
    ],
  },
]

export function ObjectivesGrid() {
  return (
    <div className="grid grid-cols-2 gap-5">
      {objectives.map((obj) => (
        <ObjectiveCard key={obj.title} obj={obj} />
      ))}
    </div>
  )
}

function ObjectiveCard({ obj }: { obj: Objective }) {
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
        {obj.krs.map((kr) => (
          <div key={kr.label} className="flex flex-col gap-1">
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
                className={cn("h-full rounded-full", s.bar)}
                style={{ width: `${kr.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
