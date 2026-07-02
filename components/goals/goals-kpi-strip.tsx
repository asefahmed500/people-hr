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
    { value: String(activeGoals), label: "Active goals", valueColor: "text-[#2f6f61]" },
    { value: String(onTrack), label: "On track", valueColor: "text-[#1f2a26]" },
    { value: String(atRisk), label: "At risk", valueColor: "text-[#d98a2b]" },
    { value: String(completed), label: "Completed", valueColor: "text-[#2e9160]" },
    { value: `${avgProgress}%`, label: "Avg progress", valueColor: "text-[#1f2a26]" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-1 rounded-[18px] border border-[#edeae3] bg-white px-5 py-4 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]"
        >
          <span
            className={cn(
              "font-display inline-block text-[26px] font-semibold leading-none",
              kpi.valueColor,
            )}
          >
            {kpi.value}
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
            {kpi.label}
          </span>
        </div>
      ))}
    </div>
  )
}
