type Row = {
  name: string
  fillPct: number
  fill: string
  amount: string
}

const rows: Row[] = [
  { name: "Engineering", fillPct: 100, fill: "bg-[#2f6f61]", amount: "$486k" },
  { name: "Sales", fillPct: 64, fill: "bg-[#64b6ac]", amount: "$312k" },
  { name: "Product", fillPct: 55, fill: "bg-[#3e9488]", amount: "$268k" },
  { name: "Design", fillPct: 36, fill: "bg-[#3bb273]", amount: "$174k" },
  { name: "Marketing", fillPct: 29, fill: "bg-[#f4a261]", amount: "$142k" },
  { name: "People", fillPct: 20, fill: "bg-[#e76f51]", amount: "$98k" },
]

export function CostByDepartment() {
  return (
    <div className="flex flex-1 flex-col gap-5 rounded-[18px] border border-[#edeae3] bg-white p-6 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex flex-col gap-1">
        <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
          Cost by department
        </h2>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
          Total payroll spend per team · February 2025
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-3">
            <span className="w-[90px] shrink-0 font-sans text-[13px] font-medium leading-normal text-[#42504a]">
              {row.name}
            </span>
            <div className="flex h-2 flex-1 overflow-clip rounded-full bg-[#f1eee8]">
              <div
                className={`h-full rounded-full ${row.fill}`}
                style={{ width: `${row.fillPct}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-sans text-[13px] font-semibold leading-normal text-[#1f2a26]">
              {row.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
