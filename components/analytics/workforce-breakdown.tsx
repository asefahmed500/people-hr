import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { DeptBreakdown, TenureBreakdown } from "@/lib/data"

type WorkforceBreakdownProps = {
  byDept?: DeptBreakdown[]
  byTenure?: TenureBreakdown[]
}

// Map the stored fill token onto the shadcn Progress indicator. These must be
// literal class strings so Tailwind can generate the arbitrary variants.
const FILL_TO_INDICATOR: Record<string, string> = {
  "bg-primary": "",
  "bg-secondary-foreground": "[&_[data-slot=progress-indicator]]:bg-secondary-foreground",
  "bg-muted-foreground": "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
  "bg-foreground": "[&_[data-slot=progress-indicator]]:bg-foreground",
}

function indicatorClass(fill: string): string {
  return FILL_TO_INDICATOR[fill] ?? ""
}

export function WorkforceBreakdown({ byDept, byTenure }: WorkforceBreakdownProps) {
  const deptRows = (byDept ?? []).map((d) => ({ label: d.label, pct: d.pct, count: String(d.count), fill: d.fill }))
  const tenureRows = (byTenure ?? []).map((d) => ({ label: d.label, pct: d.pct, count: String(d.count), fill: d.fill }))

  return (
    <div id="analytics-breakdown" className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4 lg:w-[440px] lg:shrink-0">
      <Breakdown
        title="By department"
        sub="Headcount distribution"
        rows={deptRows}
        emptyLabel="Add employees to see the department split."
      />
      <Separator />
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
        <span className="font-sans inline-block rounded-lg border border-dashed border-border px-4 py-6 text-center text-[12.5px] leading-normal text-muted-foreground">
          {emptyLabel}
        </span>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-sans text-[12.5px] font-medium leading-normal text-secondary-foreground">
                {row.label}
              </span>
              <Progress
                value={row.pct}
                className={cn("h-1.5 flex-1", indicatorClass(row.fill))}
              />
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
