import { ChevronRight, Trophy } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TeamRow } from "@/lib/data"
import { currentQuarter } from "@/lib/quarter"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type TeamLeaderboardProps = {
  onFullReport?: () => void
  teamScores?: TeamRow[]
}

export function TeamLeaderboard({ onFullReport, teamScores = [] }: TeamLeaderboardProps) {
  return (
    <div className="flex w-full flex-col overflow-clip rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Performance by team
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Ranked by average rating · {currentQuarter()}
          </span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onFullReport} className="gap-1 text-foreground">
          Full report
          <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-col">
        {teamScores.length === 0 ? (
          <div className="flex flex-col items-center gap-2 bg-muted py-8 text-center">
            <Trophy className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
            <p className="font-sans text-[13px] font-semibold text-foreground">No team data available</p>
            <p className="font-sans text-[12px] text-muted-foreground">Rankings appear once reviews are in.</p>
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
        "flex items-center gap-2 px-4 py-3 sm:gap-4 sm:px-4",
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
      <div className="flex w-[100px] shrink-0 items-center gap-2 sm:w-[130px]">
        <span className={`size-2.5 shrink-0 rounded-full ${row.dot}`} aria-hidden="true" />
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
          {row.team}
        </span>
      </div>
      <span className="w-14 shrink-0 font-sans text-[12.5px] leading-normal text-muted-foreground sm:w-20">
        {row.reviewed}
      </span>
      <Progress value={row.fillPct} className="h-2 flex-1" />
      <span className="w-10 shrink-0 text-right text-lg font-semibold leading-normal text-foreground">
        {row.rating}
      </span>
    </div>
  )
}
