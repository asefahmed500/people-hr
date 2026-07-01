type DeptRow = {
  label: string
  fillPct: number
  fill: string
}

const depts: DeptRow[] = [
  { label: "Engineering", fillPct: 82, fill: "bg-[#0f9b8e]" },
  { label: "Design", fillPct: 76, fill: "bg-[#64b6ac]" },
  { label: "Product", fillPct: 88, fill: "bg-[#0f9b8e]" },
  { label: "Sales", fillPct: 71, fill: "bg-[#f4a261]" },
  { label: "Marketing", fillPct: 79, fill: "bg-[#b96a2c]" },
]

export function OnboardingByDept() {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display inline-block text-[15px] font-semibold leading-tight text-[#1f2a26]">
          Onboarding by department
        </h2>
        <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
          Task completion rate per team
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {depts.map((dept) => (
          <div key={dept.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 font-sans text-[12.5px] font-medium leading-normal text-[#42504a]">
              {dept.label}
            </span>
            <div className="flex h-1.5 flex-1 overflow-clip rounded-full bg-[#f1eee8]">
              <div
                className={`h-full rounded-full ${dept.fill}`}
                style={{ width: `${dept.fillPct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-sans text-[11.5px] font-semibold leading-normal text-[#42504a]">
              {dept.fillPct} %
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
