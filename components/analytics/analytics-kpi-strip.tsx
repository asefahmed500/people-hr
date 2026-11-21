"use client"

import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type AnalyticsKpiStripProps = {
  headcount?: number
  headcountDelta?: string
  attrition?: string
  attritionDelta?: string
  avgTenure?: string
  avgTenureDelta?: string
  offerAcceptRate?: string
  offerAcceptRateDelta?: string
}

function Delta({ delta }: { delta: string }) {
  const negative = delta.startsWith("-")
  const up = !negative
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-5 gap-[3px] bg-foreground/10",
        negative ? "text-foreground" : "text-primary",
      )}
    >
      <Icon className="size-3" strokeWidth={2} aria-hidden="true" />
      <span className="text-[10px] font-semibold leading-none">
        {delta}
      </span>
    </Badge>
  )
}

export function AnalyticsKpiStrip({
  headcount,
  headcountDelta,
  attrition,
  attritionDelta,
  avgTenure,
  avgTenureDelta,
  offerAcceptRate,
  offerAcceptRateDelta,
}: AnalyticsKpiStripProps) {
  const kpis = [
    { label: "Total headcount", value: String(headcount ?? 0), delta: headcountDelta ?? "", sub: "new hires this month" },
    { label: "Attrition rate", value: attrition ?? "", delta: attritionDelta ?? "", sub: "Trailing 12 months" },
    { label: "Avg tenure", value: avgTenure ?? "", delta: avgTenureDelta ?? "", sub: "Company-wide average" },
    { label: "Offer accept rate", value: offerAcceptRate ?? "", delta: offerAcceptRateDelta ?? "", sub: "Of extended offers" },
  ]
  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex h-fit items-center justify-between gap-2">
            <span className="font-sans inline-block text-xs font-medium leading-normal text-muted-foreground">
              {kpi.label}
            </span>
            {kpi.delta ? <Delta delta={kpi.delta} /> : null}
          </div>
          <span className="font-sans inline-block text-[26px] font-semibold leading-none text-foreground">
            {kpi.value}
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
            {kpi.sub}
          </span>
        </div>
      ))}
    </div>
  )
}
