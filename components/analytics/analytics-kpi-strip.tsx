type Kpi = {
  label: string
  value: string
  delta: string
  sub: string
}

const kpis: Kpi[] = [
  { label: "Total headcount", value: "284", delta: "+12", sub: "vs 272 last month" },
  { label: "Attrition rate", value: "4.2%", delta: "-0.6", sub: "Trailing 12 months" },
  { label: "Avg tenure", value: "3.1 yrs", delta: "+0.2", sub: "Company-wide average" },
  { label: "Offer accept rate", value: "78%", delta: "+5%", sub: "Of extended offers" },
]

export function AnalyticsKpiStrip() {
  return (
    <div className="flex w-full gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-1 flex-col gap-2.5 rounded-[14px] border border-[#e8ebe6] bg-white p-4"
        >
          <div className="flex h-fit items-center justify-between">
            <span className="font-sans inline-block text-xs font-medium leading-normal text-[#8a948d]">
              {kpi.label}
            </span>
            <span className="flex items-center rounded-full bg-[#e7f4ec] px-2 py-0.5">
              <span className="font-sans text-[11px] font-semibold leading-normal text-[#2e9160]">
                {kpi.delta}
              </span>
            </span>
          </div>
          <span className="font-sans inline-block text-[26px] font-semibold leading-none text-[#1f2a26]">
            {kpi.value}
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
            {kpi.sub}
          </span>
        </div>
      ))}
    </div>
  )
}
