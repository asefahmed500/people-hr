import type { OnboardingTask } from "@/lib/data"
import { cn } from "@/lib/utils"

type Kpi = {
  value: string
  label: string
  valueColor: string
}

const defaultKpis: Kpi[] = [
  { value: "34", label: "New hires", valueColor: "text-[#1f2a26]" },
  { value: "58", label: "Onboarding", valueColor: "text-[#1f2a26]" },
  { value: "87%", label: "Checklist done", valueColor: "text-[#2e9160]" },
  { value: "6", label: "Overdue", valueColor: "text-[#e76f51]" },
]

export function OnboardingKpiStrip({ tasks }: { tasks?: OnboardingTask[] }) {
  const kpis: Kpi[] = tasks
    ? (() => {
        const unique = new Set(tasks.map((t) => t.hireName))
        const done = tasks.filter((t) => t.done).length
        const overdue = tasks.filter((t) => !t.done).length
        return [
          { value: String(unique.size), label: "New hires", valueColor: "text-[#1f2a26]" },
          { value: String(tasks.length), label: "Onboarding", valueColor: "text-[#1f2a26]" },
          { value: `${tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0}%`, label: "Checklist done", valueColor: "text-[#2e9160]" },
          { value: String(overdue), label: "Overdue", valueColor: "text-[#e76f51]" },
        ]
      })()
    : defaultKpis
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-1 rounded-[18px] border border-[#edeae3] bg-white px-5 py-4"
        >
          <span
            className={cn(
              "font-display inline-block text-2xl font-semibold leading-none",
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
