import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type Row = {
  rank: number
  dot: string
  team: string
  reviewed: string
  fillPct: number
  fill: string
  rating: string
  rankBg: string
  rankText: string
  highlight?: boolean
}

const rows: Row[] = [
  {
    rank: 1,
    dot: "bg-[#5f3dc4]",
    team: "People",
    reviewed: "16 reviewed",
    fillPct: 98,
    fill: "bg-[#6d5ce7]",
    rating: "4.5",
    rankBg: "bg-[#6d5ce71a]",
    rankText: "text-[#6d5ce7]",
    highlight: true,
  },
  {
    rank: 2,
    dot: "bg-[#6d5ce7]",
    team: "Design",
    reviewed: "18 reviewed",
    fillPct: 89,
    fill: "bg-[#6d5ce7]",
    rating: "4.4",
    rankBg: "bg-[#6d5ce715]",
    rankText: "text-[#6d5ce7]",
  },
  {
    rank: 3,
    dot: "bg-[#845ef7]",
    team: "Engineering",
    reviewed: "52 reviewed",
    fillPct: 96,
    fill: "bg-[#6d5ce7]",
    rating: "4.3",
    rankBg: "bg-[#6d5ce715]",
    rankText: "text-[#6d5ce7]",
  },
  {
    rank: 4,
    dot: "bg-[#b197fc]",
    team: "Product",
    reviewed: "22 reviewed",
    fillPct: 94,
    fill: "bg-[#6d5ce7]",
    rating: "4.2",
    rankBg: "bg-[#6d5ce715]",
    rankText: "text-[#6d5ce7]",
  },
  {
    rank: 5,
    dot: "bg-[#f4a261]",
    team: "Marketing",
    reviewed: "24 reviewed",
    fillPct: 95,
    fill: "bg-[#2e9160]",
    rating: "4.1",
    rankBg: "bg-[#2f6f6115]",
    rankText: "text-[#2f6f61]",
  },
  {
    rank: 6,
    dot: "bg-[#e76f51]",
    team: "Sales",
    reviewed: "46 reviewed",
    fillPct: 92,
    fill: "bg-[#2e9160]",
    rating: "3.9",
    rankBg: "bg-[#2f6f6115]",
    rankText: "text-[#2f6f61]",
  },
]

export function TeamLeaderboard() {
  return (
    <div className="flex w-full flex-col overflow-clip rounded-[18px] border border-[#e8ebe6] bg-white shadow-[0px_2px_10px_rgba(109,92,231,0.03)]">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
            Performance by team
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            Ranked by average rating · Q1 2025
          </span>
        </div>
        <button type="button" className="flex items-center gap-1">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#6d5ce7]">
            Full report
          </span>
          <ChevronRight className="size-3.5 text-[#6d5ce7]" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col">
        {rows.map((row, idx) => (
          <LeaderboardRow key={row.team} row={row} first={idx === 0} />
        ))}
      </div>
    </div>
  )
}

function LeaderboardRow({ row, first }: { row: Row; first: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-6 py-4",
        first ? "bg-[#faf9f6]" : "border-t border-t-[#f1eee8]",
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          row.rankBg,
        )}
      >
        <span
          className={cn(
            "font-sans text-xs font-bold leading-normal",
            row.rankText,
          )}
        >
          {row.rank}
        </span>
      </div>
      <div className="flex w-[130px] shrink-0 items-center gap-2">
        <span className={`size-2.5 shrink-0 rounded-full ${row.dot}`} />
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-[#1f2a26]">
          {row.team}
        </span>
      </div>
      <span className="w-20 shrink-0 font-sans text-[12.5px] leading-normal text-[#8a948d]">
        {row.reviewed}
      </span>
      <div className="flex h-2 flex-1 overflow-clip rounded-full bg-[#f1eee8]">
        <div
          className={cn("h-full rounded-full", row.fill)}
          style={{ width: `${row.fillPct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-display text-lg font-semibold leading-normal text-[#1f2a26]">
        {row.rating}
      </span>
    </div>
  )
}
