import { ChevronRight } from "lucide-react"
import type { MonthlyTrend } from "@/lib/data"
import { Button } from "@/components/ui/button"

type WorkforceTrendCardProps = {
  onOpenReport?: () => void
  monthlyTrend?: MonthlyTrend[]
}

export function WorkforceTrendCard({ onOpenReport, monthlyTrend }: WorkforceTrendCardProps) {
  // Never fabricate a trend when data is missing â€” show an honest empty state.
  const months = monthlyTrend ?? []
  // Guard against division by zero / -Infinity when the trend is empty.
  const max = Math.max(1, ...months.map((m) => m.value))
  const first = months[0]?.value ?? 0
  const last = months[months.length - 1]?.value ?? 0
  const net = last - first
  const netLabel = net > 0 ? `+${net}` : `${net}`

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Workforce trend
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Active headcount over the last 12 months
          </span>
        </div>
        <Button type="button" variant="link" size="sm" onClick={onOpenReport} className="gap-1">
          Open report
          <ChevronRight className="button-arrow size-3.5" strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
      {months.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted px-4 text-center font-sans text-[13px] text-muted-foreground">
          No workforce trend data yet.
        </div>
      ) : (
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
      )}
      <div className="flex items-center gap-6">
        <Stat value={String(months.reduce((s, m) => Math.max(s, m.value), 0))} label="Peak" />
        <Stat value={String(last)} label="Current" />
        <Stat value={netLabel} label="Net additions 12mo" tone="text-secondary-foreground" />
      </div>
    </div>
  )
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
