type Kpi = {
  value: string
  label: string
  valueColor: string
}

const kpis: Kpi[] = [
  { value: "27", label: "Open roles", valueColor: "text-[#e0663d]" },
  { value: "184", label: "Candidates", valueColor: "text-[#1f2a26]" },
  { value: "12", label: "Interviews this wk", valueColor: "text-[#1f2a26]" },
  { value: "4", label: "Roles aging 45d+", valueColor: "text-[#c4553a]" },
]

export function RecruitmentKpiStrip() {
  return (
    <div className="flex w-full items-center rounded-[18px] border border-[#edeae3] bg-white px-6 py-4">
      {kpis.map((kpi, idx) => (
        <div key={kpi.label} className="contents">
          <div className="flex flex-1 flex-col items-center gap-0.5">
            <span
              className={`font-display inline-block text-[28px] font-semibold leading-none ${kpi.valueColor}`}
            >
              {kpi.value}
            </span>
            <span className="font-sans inline-block text-xs leading-normal text-[#6b7770]">
              {kpi.label}
            </span>
          </div>
          {idx < kpis.length - 1 ? (
            <span className="flex h-10 w-px shrink-0 flex-col bg-[#edeae3]" />
          ) : null}
        </div>
      ))}
    </div>
  )
}
