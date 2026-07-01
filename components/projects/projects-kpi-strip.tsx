import { AlertCircle, ArrowUpRight, CheckCircle2, TrendingUp } from "lucide-react"

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

const kpis: Kpi[] = [
  {
    value: "24",
    label: "Active projects",
    valueColor: "text-[#2f6fd0]",
    trend: {
      text: "+2 new",
      bg: "bg-[#2f6fd010]",
      text2: "text-[#2f6fd0]",
      icon: TrendingUp,
      iconColor: "text-[#2f6fd0]",
    },
  },
  {
    value: "16",
    label: "On track",
    valueColor: "text-[#2f6fd0]",
    trend: {
      text: "67% of total",
      bg: "bg-[#2e916010]",
      text2: "text-[#2e9160]",
      icon: CheckCircle2,
      iconColor: "text-[#2e9160]",
    },
  },
  {
    value: "72%",
    label: "Avg completion",
    valueColor: "text-[#2f6fd0]",
    trend: {
      text: "+4.2% MoM",
      bg: "bg-[#2f6fd010]",
      text2: "text-[#2f6fd0]",
      icon: ArrowUpRight,
      iconColor: "text-[#2f6fd0]",
    },
  },
  {
    value: "4",
    label: "At risk",
    valueColor: "text-[#d98a2b]",
    trend: {
      text: "1 high priority",
      bg: "bg-[#d0553f10]",
      text2: "text-[#d0553f]",
      icon: AlertCircle,
      iconColor: "text-[#d0553f]",
    },
  },
]

export function ProjectsKpiStrip() {
  return (
    <div className="flex w-full items-center rounded-[14px] border border-[#e8ebe6] bg-white px-6 py-4">
      {kpis.map((kpi, idx) => (
        <div key={kpi.label} className="contents">
          <div className="flex flex-1 flex-col items-center gap-1">
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
                "mx-0 mb-0 mt-0.5 flex items-center gap-1 rounded-full px-1.5 py-0.5",
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
          {idx < kpis.length - 1 ? (
            <span className="flex h-10 w-px shrink-0 flex-col bg-[#e8ebe6]" />
          ) : null}
        </div>
      ))}
    </div>
  )
}
