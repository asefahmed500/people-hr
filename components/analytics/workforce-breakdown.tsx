import { cn } from "@/lib/utils"
import type { DeptBreakdown, TenureBreakdown } from "@/lib/data"

type WorkforceBreakdownProps = {
  byDept?: DeptBreakdown[]
  byTenure?: TenureBreakdown[]
}

export function WorkforceBreakdown({ byDept, byTenure }: WorkforceBreakdownProps) {
  const deptRows = (byDept ?? []).map((d) => ({ label: d.label, pct: d.pct, count: String(d.count), fill: d.fill }))
  const tenureRows = (byTenure ?? []).map((d) => ({ label: d.label, pct: d.pct, count: String(d.count), fill: d.fill }))

  return (
    <div id="analytics-breakdown" className="flex w-[440px] shrink-0 flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <Breakdown
        title="By department"
        sub="Headcount distribution"
        rows={deptRows}
        emptyLabel="Add employees to see the department split."
      />
      <span className="h-px w-full bg-muted" />
      <Breakdown
        title="By tenure"
        sub="Years at company"
        rows={tenureRows}
        emptyLabel="Add employees to see the tenure split."
      />
    </div>
  )
}

function Breakdown({
  title,
  sub,
  rows,
  emptyLabel,
}: {
  title: string
  sub: string
  rows: { label: string; pct: number; count: string; fill: string }[]
  emptyLabel: string
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-h4">
          {title}
        </h3>
        <span className="font-sans inline-block text-[12px] leading-normal text-muted-foreground">
          {sub}
        </span>
      </div>
      {rows.length === 0 ? (
        <span className="font-sans inline-block rounded-xl border border-dashed border-border px-4 py-6 text-center text-[12.5px] leading-normal text-muted-foreground">
          {emptyLabel}
        </span>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-sans text-[12.5px] font-medium leading-normal text-secondary-foreground">
                {row.label}
              </span>
              <div className="flex h-1.5 flex-1 overflow-clip rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", row.fill)}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-sans text-[11.5px] font-semibold leading-normal text-secondary-foreground">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
