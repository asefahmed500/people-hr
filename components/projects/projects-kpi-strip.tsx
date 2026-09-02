import { AlertCircle, ArrowUpRight, CheckCircle2, TrendingUp } from "lucide-react"
import type { ProjectTask } from "@/lib/data"

import { cn } from "@/lib/utils"

type Trend = {
  text: string
  bg: string
  text2: string
  icon: typeof TrendingUp
  iconColor: string
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
        bg: "bg-foreground/5",
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
        bg: "bg-foreground/5",
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
        bg: "bg-foreground/5",
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
        bg: "bg-foreground/10",
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
          className="flex flex-col gap-1 rounded-2xl border border-border bg-card px-5 py-4"
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
          <span
            className={cn(
              "mt-0.5 flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5",
              kpi.trend.bg,
            )}
          >
            <kpi.trend.icon
              className={cn("size-3", kpi.trend.iconColor)}
              strokeWidth={2}
            />
            <span
              className={cn(
                "font-sans inline-block text-[11px] font-medium leading-normal",
                kpi.trend.text2,
              )}
            >
              {kpi.trend.text}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
