import { cn } from "@/lib/utils"

type Kpi = {
  value: string
  label: string
  valueColor: string
}

const kpis: Kpi[] = [
  { value: "48", label: "Active goals", valueColor: "text-[#2f6f61]" },
  { value: "31", label: "On track", valueColor: "text-[#1f2a26]" },
  { value: "7", label: "At risk", valueColor: "text-[#d98a2b]" },
  { value: "10", label: "Completed", valueColor: "text-[#2e9160]" },
  { value: "64%", label: "Avg progress", valueColor: "text-[#1f2a26]" },
]

export function GoalsKpiStrip() {
  return (
    <div className="flex w-full items-center rounded-[18px] border border-[#edeae3] bg-white px-6 py-4 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      {kpis.map((kpi, idx) => (
        <div key={kpi.label} className="contents">
          <div className="flex flex-1 flex-col items-center gap-0.5">
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
          {idx < kpis.length - 1 ? (
            <span className="mx-2 my-0 flex h-9 w-px shrink-0 flex-col bg-[#edeae3]" />
          ) : null}
        </div>
      ))}
    </div>
  )
}
