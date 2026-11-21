import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Payment } from "@/lib/data"

type Row = {
  name: string
  fillPct: number
  indicatorClass: string
  amount: string
}

// Tailwind arbitrary variants recolor the shadcn Progress indicator per team.
const DEPT_FILLS: Record<string, string> = {
  Engineering: "",
  Sales: "[&_[data-slot=progress-indicator]]:bg-secondary-foreground",
  Product: "[&_[data-slot=progress-indicator]]:bg-secondary-foreground",
  Design: "[&_[data-slot=progress-indicator]]:bg-secondary-foreground",
  Marketing: "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
  People: "[&_[data-slot=progress-indicator]]:bg-foreground",
  Research: "",
  Finance: "[&_[data-slot=progress-indicator]]:bg-foreground",
}

const DEPT_ORDER = ["Engineering", "Sales", "Product", "Design", "Marketing", "People", "Research", "Finance"]

export function CostByDepartment({ payments }: { payments: Payment[] }) {
  const deptTotals: Record<string, number> = {}
  for (const p of payments) {
    deptTotals[p.department] = (deptTotals[p.department] ?? 0) + p.gross
  }
  const maxVal = Math.max(...Object.values(deptTotals), 1)
  const rows: Row[] = DEPT_ORDER.filter((d) => deptTotals[d])
    .map((name) => ({
      name,
      fillPct: Math.round((deptTotals[name] / maxVal) * 100),
      indicatorClass: DEPT_FILLS[name] ?? "",
      amount:
        deptTotals[name] >= 1_000_000
          ? `$${(deptTotals[name] / 1_000_000).toFixed(1)}M`
          : deptTotals[name] >= 1_000
            ? `$${Math.round(deptTotals[name] / 1_000)}k`
            : `$${deptTotals[name]}`,
    }))
    .slice(0, 6)

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">Cost by department</h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Total payroll spend per team
          </span>
        </div>
        <p className="font-sans text-[13px] text-muted-foreground">
          Run payroll to see department cost breakdown.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">
          Cost by department
        </h2>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
          Total payroll spend per team
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-3">
            <span className="w-[90px] shrink-0 font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              {row.name}
            </span>
            <Progress
              value={row.fillPct}
              className={cn("h-2 flex-1", row.indicatorClass)}
            />
            <span className="w-12 shrink-0 text-right font-sans text-[13px] font-semibold leading-normal text-foreground">
              {row.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
