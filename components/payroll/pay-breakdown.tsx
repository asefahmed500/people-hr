import { Info } from "lucide-react"

import type { Payment } from "@/lib/data"

export function PayBreakdown({ payments }: { payments: Payment[] }) {
  const G = payments.reduce((s, p) => s + p.gross, 0)
  const D = payments.reduce((s, p) => s + p.deductions, 0)
  const taxesPct = G > 0 ? Math.round((D / G) * 100) : 0
  const rows = [
    { label: "Net pay", pct: Math.max(0, 100 - taxesPct), fill: "bg-primary" },
    { label: "Taxes & deductions", pct: taxesPct, fill: "bg-muted-foreground" },
  ]
  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">
          Pay breakdown
        </h2>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
          Gross pay composition
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-sans inline-block text-[13px] font-medium leading-normal text-secondary-foreground">
                {row.label}
              </span>
              <span className="font-sans inline-block text-xs font-semibold leading-normal text-muted-foreground">
                {row.pct}%
              </span>
            </div>
            <div className="flex h-1.5 w-full overflow-clip rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${row.fill}`}
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 border-t border-t-border px-0 pb-0 pt-1">
        <Info className="mx-0 mb-0 mt-px size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
        <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
          Net pay and deductions as a share of gross pay.
        </span>
      </div>
    </div>
  )
}