import type { OnboardingTask } from "@/lib/data"
import { cn } from "@/lib/utils"

type Kpi = {
  value: string
  label: string
  valueColor: string
}

export function OnboardingKpiStrip({ tasks }: { tasks: OnboardingTask[] }) {
  const unique = new Set(tasks.map((t) => t.hireName))
  const done = tasks.filter((t) => t.done).length
  const overdue = tasks.filter((t) => !t.done).length
  const kpis: Kpi[] = [
    { value: String(unique.size), label: "New hires", valueColor: "text-foreground" },
    { value: String(tasks.length), label: "Tasks", valueColor: "text-foreground" },
    { value: `${tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0}%`, label: "Checklist done", valueColor: "text-secondary-foreground" },
    { value: String(overdue), label: "Incomplete", valueColor: "text-foreground" },
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
          <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
            {kpi.label}
          </span>
        </div>
      ))}
    </div>
  )
}
