import { AlertCircle, ArrowUpRight, CheckCircle2, TrendingUp } from "lucide-react"
import type { ProjectTask } from "@/lib/data"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type Trend = {
  text: string
  icon: typeof TrendingUp
  iconColor: string
  text2: string
}

type Kpi = {
  value: string
  label: string
  valueColor: string
  trend: Trend
}

export function ProjectsKpiStrip({ tasks }: { tasks?: ProjectTask[] }) {
  const total = tasks?.length ?? 0
  const onTrack = tasks?.filter((t) => t.status === "on-track").length ?? 0
  const atRisk = tasks?.filter((t) => t.status === "at-risk").length ?? 0
  const delayed = tasks?.filter((t) => t.status === "delayed").length ?? 0
  const avgProgress = total
    ? Math.round(tasks!.reduce((s, t) => s + t.progress, 0) / total)
    : 0

  const kpis: Kpi[] = [
    {
      value: String(total),
      label: "Active projects",
      valueColor: "text-primary",
      trend: {
        text: `${delayed} delayed`,
        text2: "text-primary",
        icon: TrendingUp,
        iconColor: "text-primary",
      },
    },
    {
      value: String(onTrack),
      label: "On track",
      valueColor: "text-primary",
      trend: {
        text: `${total ? Math.round((onTrack / total) * 100) : 0}% of total`,
        text2: "text-secondary-foreground",
        icon: CheckCircle2,
        iconColor: "text-secondary-foreground",
      },
    },
    {
      value: `${avgProgress}%`,
      label: "Avg completion",
      valueColor: "text-primary",
      trend: {
        text: "from tasks",
        text2: "text-primary",
        icon: ArrowUpRight,
        iconColor: "text-primary",
      },
    },
    {
      value: String(atRisk + delayed),
      label: "At risk / delayed",
      valueColor: "text-secondary-foreground",
      trend: {
        text: `${atRisk} at risk`,
        text2: "text-foreground",
        icon: AlertCircle,
        iconColor: "text-foreground",
      },
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3"
        >
          <span
            className={cn(
              "inline-block text-2xl font-semibold leading-none",
              kpi.valueColor,
            )}
          >
            {kpi.value}
          </span>
          <span className="font-sans inline-block text-xs font-medium leading-normal text-muted-foreground">
            {kpi.label}
          </span>
          <Badge variant="secondary" className="mt-0.5 w-fit gap-1 px-1.5">
            <kpi.trend.icon
              className={cn("size-3", kpi.trend.iconColor)}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span
              className={cn(
                "font-sans inline-block text-[11px] font-medium leading-normal",
                kpi.trend.text2,
              )}
            >
              {kpi.trend.text}
            </span>
          </Badge>
        </div>
      ))}
    </div>
  )
}
