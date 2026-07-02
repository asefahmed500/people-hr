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
      valueColor: "text-[#2f6fd0]",
      trend: {
        text: `${delayed} delayed`,
        bg: "bg-[#2f6fd010]",
        text2: "text-[#2f6fd0]",
        icon: TrendingUp,
        iconColor: "text-[#2f6fd0]",
      },
    },
    {
      value: String(onTrack),
      label: "On track",
      valueColor: "text-[#2f6fd0]",
      trend: {
        text: `${total ? Math.round((onTrack / total) * 100) : 0}% of total`,
        bg: "bg-[#2e916010]",
        text2: "text-[#2e9160]",
        icon: CheckCircle2,
        iconColor: "text-[#2e9160]",
      },
    },
    {
      value: `${avgProgress}%`,
      label: "Avg completion",
      valueColor: "text-[#2f6fd0]",
      trend: {
        text: "from tasks",
        bg: "bg-[#2f6fd010]",
        text2: "text-[#2f6fd0]",
        icon: ArrowUpRight,
        iconColor: "text-[#2f6fd0]",
      },
    },
    {
      value: String(atRisk + delayed),
      label: "At risk / delayed",
      valueColor: "text-[#d98a2b]",
      trend: {
        text: `${atRisk} at risk`,
        bg: "bg-[#d0553f10]",
        text2: "text-[#d0553f]",
        icon: AlertCircle,
        iconColor: "text-[#d0553f]",
      },
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-1 rounded-[14px] border border-[#e8ebe6] bg-white px-5 py-4"
        >
          <span
            className={cn(
              "font-display inline-block text-2xl font-bold leading-none",
              kpi.valueColor,
            )}
          >
            {kpi.value}
          </span>
          <span className="font-sans inline-block text-xs font-medium leading-normal text-[#8a948d]">
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
