export function RecruitmentKpiStrip({
  openRoles,
  candidates,
  interviews,
  aged,
}: {
  openRoles: number
  candidates: number
  interviews: number
  aged: number
}) {
  const kpis = [
    { value: String(openRoles), label: "Open roles", valueColor: "text-[#e0663d]" },
    { value: String(candidates), label: "Candidates", valueColor: "text-[#1f2a26]" },
    { value: String(interviews), label: "Interviews this wk", valueColor: "text-[#1f2a26]" },
    { value: String(aged), label: "Roles aging 45d+", valueColor: "text-[#c4553a]" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-1 rounded-[18px] border border-[#edeae3] bg-white px-5 py-4"
        >
          <span
            className={`font-display inline-block text-[28px] font-semibold leading-none ${kpi.valueColor}`}
          >
            {kpi.value}
          </span>
          <span className="font-sans inline-block text-xs leading-normal text-[#6b7770]">
            {kpi.label}
          </span>
        </div>
      ))}
    </div>
  )
}
