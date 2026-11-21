import type { Objective } from "@/lib/data"
import { cn } from "@/lib/utils"

export function GoalsKpiStrip({
  objectives,
}: {
  objectives?: Objective[]
}) {
  const activeGoals = objectives?.length ?? 0
  const onTrack = objectives?.filter((o) => o.status === "on-track").length ?? 0
  const atRisk = objectives?.filter((o) => o.status === "at-risk").length ?? 0
  const completed = objectives?.filter((o) => o.status === "completed").length ?? 0
  const avgProgress = objectives?.length
    ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length)
    : 0

  const kpis = [
    { value: String(activeGoals), label: "Active goals", valueColor: "text-primary" },
    { value: String(onTrack), label: "On track", valueColor: "text-foreground" },
    { value: String(atRisk), label: "At risk", valueColor: "text-secondary-foreground" },
    { value: String(completed), label: "Completed", valueColor: "text-secondary-foreground" },
    { value: `${avgProgress}%`, label: "Avg progress", valueColor: "text-foreground" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3"
        >
          <span
            className={cn(
              "inline-block text-[26px] font-semibold leading-none",
              kpi.valueColor,
            )}
          >
            {kpi.value}
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
            {kpi.label}
          </span>
        </div>
      ))}
    </div>
  )
}
