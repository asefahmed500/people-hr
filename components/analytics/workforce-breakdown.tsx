import { cn } from "@/lib/utils"
import type { DeptBreakdown, TenureBreakdown } from "@/lib/data"

type WorkforceBreakdownProps = {
  byDept?: DeptBreakdown[]
  byTenure?: TenureBreakdown[]
}

export function WorkforceBreakdown({ byDept, byTenure }: WorkforceBreakdownProps) {
  const deptRows = (byDept ?? [
    { label: "Engineering", pct: 30, count: 284, fill: "bg-[#2f6f61]" },
    { label: "Sales", pct: 18, count: 142, fill: "bg-[#64b6ac]" },
    { label: "Product", pct: 14, count: 124, fill: "bg-[#3e9488]" },
    { label: "Design", pct: 9, count: 86, fill: "bg-[#3bb273]" },
    { label: "Marketing", pct: 8, count: 68, fill: "bg-[#f4a261]" },
    { label: "People", pct: 6, count: 42, fill: "bg-[#7ba88c]" },
  ]).map((d) => ({ label: d.label, pct: d.pct, count: String(d.count), fill: d.fill }))
  const tenureRows = (byTenure ?? [
    { label: "< 1 year", pct: 22, count: 63, fill: "bg-[#64b6ac]" },
    { label: "1–2 years", pct: 28, count: 80, fill: "bg-[#2f6f61]" },
    { label: "2–4 years", pct: 31, count: 88, fill: "bg-[#3bb273]" },
    { label: "4–7 years", pct: 13, count: 37, fill: "bg-[#f4a261]" },
    { label: "7+ years", pct: 6, count: 16, fill: "bg-[#e76f51]" },
  ]).map((d) => ({ label: d.label, pct: d.pct, count: String(d.count), fill: d.fill }))

  return (
    <div className="flex w-[440px] shrink-0 flex-col gap-5 rounded-[18px] border border-[#e8ebe6] bg-white p-6">
      <Breakdown
        title="By department"
        sub="Headcount distribution"
        rows={deptRows}
      />
      <span className="h-px w-full bg-[#f1eee8]" />
      <Breakdown title="By tenure" sub="Years at company" rows={tenureRows} />
    </div>
  )
}

function Breakdown({
  title,
  sub,
  rows,
}: {
  title: string
  sub: string
  rows: { label: string; pct: number; count: string; fill: string }[]
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-display inline-block text-[15px] font-semibold leading-tight text-[#1f2a26]">
          {title}
        </h3>
        <span className="font-sans inline-block text-[12px] leading-normal text-[#8a948d]">
          {sub}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 font-sans text-[12.5px] font-medium leading-normal text-[#5b655e]">
              {row.label}
            </span>
            <div className="flex h-1.5 flex-1 overflow-clip rounded-full bg-[#f1eee8]">
              <div
                className={cn("h-full rounded-full", row.fill)}
                style={{ width: `${row.pct}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-sans text-[11.5px] font-semibold leading-normal text-[#42504a]">
              {row.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
