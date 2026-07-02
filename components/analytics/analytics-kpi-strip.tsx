type AnalyticsKpiStripProps = {
  headcount?: number
  headcountDelta?: string
  attrition?: string
  attritionDelta?: string
  avgTenure?: string
  avgTenureDelta?: string
  offerAcceptRate?: string
  offerAcceptRateDelta?: string
}

export function AnalyticsKpiStrip({
  headcount = 284,
  headcountDelta = "+12",
  attrition = "4.2%",
  attritionDelta = "-0.6",
  avgTenure = "3.1 yrs",
  avgTenureDelta = "+0.2",
  offerAcceptRate = "78%",
  offerAcceptRateDelta = "+5%",
}: AnalyticsKpiStripProps) {
  const kpis = [
    { label: "Total headcount", value: String(headcount), delta: headcountDelta, sub: "vs 272 last month" },
    { label: "Attrition rate", value: attrition, delta: attritionDelta, sub: "Trailing 12 months" },
    { label: "Avg tenure", value: avgTenure, delta: avgTenureDelta, sub: "Company-wide average" },
    { label: "Offer accept rate", value: offerAcceptRate, delta: offerAcceptRateDelta, sub: "Of extended offers" },
  ]
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
