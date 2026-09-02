import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TeamRow } from "@/lib/data"
import { currentQuarter } from "@/lib/quarter"

type TeamLeaderboardProps = {
  onFullReport?: () => void
  teamScores?: TeamRow[]
}

export function TeamLeaderboard({ onFullReport, teamScores = [] }: TeamLeaderboardProps) {
  return (
    <div className="flex w-full flex-col overflow-clip rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Performance by team
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Ranked by average rating · {currentQuarter()}
          </span>
        </div>
        <button type="button" onClick={onFullReport} className="flex items-center gap-1">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-foreground">
            Full report
          </span>
          <ChevronRight className="size-3.5 text-foreground" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col">
        {teamScores.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <span className="font-sans text-[13px] leading-normal text-muted-foreground">
              No team data available
            </span>
          </div>
        ) : (
          teamScores.map((row, idx) => (
            <LeaderboardRow key={row.team} row={row} first={idx === 0} />
          ))
        )}
      </div>
    </div>
  )
}

type RowDisplay = {
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

function LeaderboardRow({ row, first }: { row: RowDisplay; first: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-6 py-4",
        first ? "bg-muted" : "border-t border-t-border",
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
            "font-sans text-xs font-semibold leading-normal",
            row.rankText,
          )}
        >
          {row.rank}
        </span>
      </div>
      <div className="flex w-[130px] shrink-0 items-center gap-2">
        <span className={`size-2.5 shrink-0 rounded-full ${row.dot}`} />
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
          {row.team}
        </span>
      </div>
      <span className="w-20 shrink-0 font-sans text-[12.5px] leading-normal text-muted-foreground">
        {row.reviewed}
      </span>
      <div className="flex h-2 flex-1 overflow-clip rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", row.fill)}
          style={{ width: `${row.fillPct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-lg font-semibold leading-normal text-foreground">
        {row.rating}
      </span>
    </div>
  )
}
