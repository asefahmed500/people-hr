import type { Balances } from "@/lib/data"
import { Progress } from "@/components/ui/progress"

type Balance = {
  label: string
  meta: string
  fillPct: number
}

const BALANCE_MAP: Record<string, { label: string }> = {
  annual: { label: "Vacation" },
  sick: { label: "Sick" },
  personal: { label: "Personal" },
  parental: { label: "Parental" },
}

export function BalanceByType({ balances }: { balances?: Balances }) {
  const b = balances ?? { annual: null, sick: null, personal: null, parental: null }
  const items: Balance[] = (Object.entries(BALANCE_MAP) as [keyof Balances, { label: string }][]).map(
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
      }
    },
  )

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
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
            <Progress value={balance.fillPct} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  )
}
