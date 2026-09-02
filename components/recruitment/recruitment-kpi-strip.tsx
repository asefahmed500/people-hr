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
    { value: String(openRoles), label: "Open roles", valueColor: "text-primary" },
    { value: String(candidates), label: "Candidates", valueColor: "text-foreground" },
    { value: String(interviews), label: "Interviews this wk", valueColor: "text-foreground" },
    { value: String(aged), label: "Roles aging 45d+", valueColor: "text-foreground" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-1 rounded-2xl border border-border bg-card px-5 py-4"
        >
          <span
            className={`inline-block text-[28px] font-semibold leading-none ${kpi.valueColor}`}
          >
            {kpi.value}
          </span>
          <span className="font-sans inline-block text-xs leading-normal text-secondary-foreground">
            {kpi.label}
          </span>
        </div>
      ))}
    </div>
  )
}
