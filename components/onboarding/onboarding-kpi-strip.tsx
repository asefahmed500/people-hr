import { cn } from "@/lib/utils"

type Kpi = {
  value: string
  label: string
  valueColor: string
}

const kpis: Kpi[] = [
  { value: "34", label: "New hires", valueColor: "text-[#1f2a26]" },
  { value: "58", label: "Onboarding", valueColor: "text-[#1f2a26]" },
  { value: "87%", label: "Checklist done", valueColor: "text-[#2e9160]" },
  { value: "6", label: "Overdue", valueColor: "text-[#e76f51]" },
]

export function OnboardingKpiStrip() {
  return (
    <div className="flex w-full items-center rounded-[18px] border border-[#edeae3] bg-white px-6 py-4">
      {kpis.map((kpi, idx) => (
        <div key={kpi.label} className="contents">
          <div className="flex flex-1 flex-col items-center gap-0.5">
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
          {idx < kpis.length - 1 ? (
            <span className="mx-2 my-0 flex h-9 w-px shrink-0 flex-col bg-[#edeae3]" />
          ) : null}
        </div>
      ))}
    </div>
  )
}
