type DeptRow = {
  name: string
  meta: string
  fillPct: number
}

const depts: DeptRow[] = [
  { name: "Engineering", meta: "8 open · 54 applicants", fillPct: 100 },
  { name: "Sales", meta: "7 open · 41 applicants", fillPct: 88 },
  { name: "Product", meta: "3 open · 28 applicants", fillPct: 38 },
  { name: "Design", meta: "2 open · 19 applicants", fillPct: 25 },
  { name: "Marketing", meta: "3 open · 22 applicants", fillPct: 38 },
  { name: "People", meta: "2 open · 20 applicants", fillPct: 25 },
]

export function OpenRolesByDept() {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-6">
      <h2 className="font-display inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Open roles by department
      </h2>
      <div className="flex flex-col gap-3">
        {depts.map((dept) => (
          <div key={dept.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-sans inline-block text-xs font-semibold leading-normal text-[#1f2a26]">
                {dept.name}
              </span>
              <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
                {dept.meta}
              </span>
            </div>
            <div className="flex h-1.5 w-full rounded-full bg-[#edeae3]">
              <div
                className="h-full rounded-full bg-[#2f6f61]"
                style={{ width: `${dept.fillPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
