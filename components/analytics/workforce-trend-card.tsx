import { ChevronRight } from "lucide-react"
import type { MonthlyTrend } from "@/lib/data"

type WorkforceTrendCardProps = {
  onOpenReport?: () => void
  monthlyTrend?: MonthlyTrend[]
}

export function WorkforceTrendCard({ onOpenReport, monthlyTrend }: WorkforceTrendCardProps) {
  const months = monthlyTrend ?? buildFallback()
  // Guard against division by zero / -Infinity when the trend is empty.
  const max = Math.max(1, ...months.map((m) => m.value))
  const first = months[0]?.value ?? 0
  const last = months[months.length - 1]?.value ?? 0
  const net = last - first
  const netLabel = net > 0 ? `+${net}` : `${net}`

  return (
    <div className="flex flex-1 flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Workforce trend
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Active headcount over the last 12 months
          </span>
        </div>
        <button type="button" onClick={onOpenReport} className="flex items-center gap-1">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-primary">
            Open report
          </span>
          <ChevronRight className="size-3.5 text-primary" strokeWidth={2} />
        </button>
      </div>
      <div className="flex h-[200px] items-end justify-between gap-2.5 border-b border-b-border pb-2.5">
        {months.map((m) => (
          <div
            key={m.month}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="flex w-full max-w-6 flex-col justify-end">
              <div
                className={
                  m.current
                    ? "w-full rounded-tl-[5px] rounded-tr-[5px] bg-primary"
                    : "w-full rounded-tl-[5px] rounded-tr-[5px] bg-secondary-foreground"
                }
                style={{ height: `${Math.round((m.value / max) * 170)}px` }}
              />
            </div>
            <span
              className={
                m.current
                  ? "font-sans inline-block text-[10.5px] font-semibold leading-normal text-primary"
                  : "font-sans inline-block text-[10.5px] leading-normal text-muted-foreground"
              }
            >
              {m.month}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <Stat value={String(months.reduce((s, m) => Math.max(s, m.value), 0))} label="Peak" />
        <Stat value={String(last)} label="Current" />
        <Stat value={netLabel} label="Net additions 12mo" tone="text-secondary-foreground" />
      </div>
    </div>
  )
}

function buildFallback(): { month: string; value: number; current?: boolean }[] {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const now = new Date()
  const months: { month: string; value: number; current?: boolean }[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: names[d.getMonth()],
      value: Math.round(38 + (11 - i) * 5),
      current: i === 0,
    })
  }
  return months
}

function Stat({
  value,
  label,
  tone,
}: {
  value: string
  label: string
  tone?: string
}) {
  return (
    <div className="flex flex-col">
      <span
        className={
          tone
            ? `inline-block text-[19px] font-semibold leading-normal ${tone}`
            : "text-h3"
        }
      >
        {value}
      </span>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
