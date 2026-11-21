import { Star, UserMinus } from "lucide-react"

import type { Review, TeamRow } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

type PerformanceSpotlightProps = {
  reviews?: Review[]
  teamScores?: TeamRow[]
}

export function PerformanceSpotlight({ reviews = [], teamScores = [] }: PerformanceSpotlightProps) {
  const total = reviews.length
  const ratings = reviews.map((r) => r.rating)
  const avg = total ? ratings.reduce((a, b) => a + b, 0) / total : 0
  const belowCount = reviews.filter((r) => r.status === "below" || r.status === "needs").length
  const cyclePct = teamScores.length
    ? Math.round(teamScores.reduce((s, t) => s + t.fillPct, 0) / teamScores.length)
    : 0

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row">
      <SpotlightCard avg={avg} total={total} cyclePct={cyclePct} teamsRanked={teamScores.length} />
      <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row lg:w-[300px] lg:flex-col">
        <MetricCardComponent
          iconBg="bg-foreground/10"
          iconColor="text-foreground"
          label="Avg rating"
          value={avg.toFixed(1)}
          delta=""
          deltaColor="text-foreground"
          sub="Company-wide average"
          star="purple"
        />
        <MetricCardComponent
          iconBg="bg-foreground/10"
          iconColor="text-foreground"
          label="Below expectations"
          value={String(belowCount)}
          delta=""
          deltaColor="text-secondary-foreground"
          sub="Needs improvement & below"
          star="coral"
        />
      </div>
    </div>
  )
}

function SpotlightCard({
  avg,
  total,
  cyclePct,
  teamsRanked,
}: {
  avg: number
  total: number
  cyclePct: number
  teamsRanked: number
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg border border-foreground/20 bg-foreground/10 p-4">
      <div className="flex flex-col gap-2">
        <span className="font-sans inline-block text-[11px] font-semibold uppercase leading-normal tracking-[0.8px] text-foreground">
          Current cycle · Snapshot
        </span>
        <span className="text-h1">
          {cyclePct}%
        </span>
        <span className="font-sans inline-block text-base font-medium text-foreground">
          Review cycle complete
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubStat value={avg.toFixed(1)} label="Avg rating" />
        <SubStat value={String(total)} label="Reviews submitted" />
        <SubStat value={String(teamsRanked)} label="Teams ranked" />
      </div>
    </div>
  )
}

function SubStat({ value, label }: { value: string; label: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 border-border bg-card px-3 py-1.5">
      <span className="text-label text-primary">
        {value}
      </span>
      <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
        {label}
      </span>
    </Badge>
  )
}

function MetricCardComponent({
  iconBg,
  iconColor,
  label,
  value,
  delta,
  deltaColor,
  sub,
  star,
}: {
  iconBg: string
  iconColor: string
  label: string
  value: string
  delta: string
  deltaColor: string
  sub: string
  star?: "purple" | "coral"
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-[42px] shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          {star === "purple" ? (
            <Star className={`size-5 ${iconColor}`} strokeWidth={2} aria-hidden="true" />
          ) : (
            <UserMinus className={`size-5 ${iconColor}`} strokeWidth={2} aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-stat">
              {value}
            </span>
            {delta ? (
              <span
                className={`font-sans inline-block text-xs font-semibold leading-normal ${deltaColor}`}
              >
                {delta}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
        {sub}
      </span>
    </div>
  )
}
