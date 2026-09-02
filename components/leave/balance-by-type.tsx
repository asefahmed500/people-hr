import type { Balances } from "@/lib/data"
import { cn } from "@/lib/utils"

type Balance = {
  label: string
  meta: string
  fillPct: number
  fill: string
}

const BALANCE_MAP: Record<string, { label: string; fill: string }> = {
  annual: { label: "Vacation", fill: "bg-primary" },
  sick: { label: "Sick", fill: "bg-secondary-foreground" },
  personal: { label: "Personal", fill: "bg-muted-foreground" },
  parental: { label: "Parental", fill: "bg-foreground" },
}

export function BalanceByType({ balances }: { balances?: Balances }) {
  const b = balances ?? { annual: null, sick: null, personal: null, parental: null }
  const items: Balance[] = (Object.entries(BALANCE_MAP) as [keyof Balances, { label: string; fill: string }][]).map(
    ([key, meta]) => {
      const entry = b[key]
      const used = entry?.used ?? 0
      const total = entry?.total ?? 0
      const left = total - used
      const fillPct = total > 0 ? Math.round((used / total) * 100) : 0
      return {
        label: meta.label,
        meta: total > 0 ? `${used}d used · ${left}d left` : "No balance yet",
        fillPct,
        fill: meta.fill,
      }
    },
  )

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="text-h4">
        Balance by type
      </h2>
      <div className="flex flex-col gap-4">
        {items.map((balance) => (
          <div key={balance.label} className="flex flex-col gap-[7px]">
            <div className="flex items-center justify-between">
              <span className="font-sans inline-block text-xs font-medium leading-normal text-foreground">
                {balance.label}
              </span>
              <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
                {balance.meta}
              </span>
            </div>
            <div className="flex h-1.5 w-full rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", balance.fill)}
                style={{ width: `${balance.fillPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
