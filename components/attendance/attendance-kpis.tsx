import { cn } from "@/lib/utils"

type Kpi = {
  label: string
  icon: string
  iconBg: string
  iconColor: string
  value: string
  delta: string
  deltaColor: string
}

const kpis: Kpi[] = [
  {
    label: "Present",
    icon: "✓",
    iconBg: "bg-[#22b8cf1a]",
    iconColor: "text-[#22b8cf]",
    value: "94.2%",
    delta: "+1.1% vs yesterday",
    deltaColor: "text-[#22b8cf]",
  },
  {
    label: "On-time",
    icon: "⏱",
    iconBg: "bg-[#22b8cf1a]",
    iconColor: "text-[#22b8cf]",
    value: "96.8%",
    delta: "+0.6% vs yesterday",
    deltaColor: "text-[#2e9160]",
  },
  {
    label: "Avg hours",
    icon: "⏳",
    iconBg: "bg-[#64b6ac1a]",
    iconColor: "text-[#64b6ac]",
    value: "8.1h",
    delta: "Today’s average",
    deltaColor: "text-[#8a948d]",
  },
  {
    label: "Absent",
    icon: "!",
    iconBg: "bg-[#e76f511a]",
    iconColor: "text-[#e76f51]",
    value: "32",
    delta: "-4 vs yesterday",
    deltaColor: "text-[#e76f51]",
  },
]

export function AttendanceKpis() {
  return (
    <div className="flex gap-5">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-[18px] border border-[#edeae3] bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="font-sans inline-block text-xs text-[#8a948d]">
          {kpi.label}
        </span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            kpi.iconBg,
          )}
        >
          <span
            className={cn(
              "font-sans text-sm font-bold leading-none",
              kpi.iconColor,
            )}
          >
            {kpi.icon}
          </span>
        </div>
      </div>
      <span className="font-display inline-block text-[26px] font-bold leading-none text-[#1f2a26]">
        {kpi.value}
      </span>
      <span
        className={cn("font-sans inline-block text-xs", kpi.deltaColor)}
      >
        {kpi.delta}
      </span>
    </div>
  )
}
