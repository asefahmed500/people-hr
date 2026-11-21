import type { Review } from "@/lib/data"
import { currentQuarter } from "@/lib/quarter"

type RatingDistributionProps = {
  reviews?: Review[]
}

export function RatingDistribution({ reviews = [] }: RatingDistributionProps) {
  const counts = { exceeds: 0, meets: 0, below: 0, needs: 0 }
  reviews.forEach((r) => {
    if (r.status in counts) counts[r.status as keyof typeof counts] += 1
  })
  const total = reviews.length

  const segments = [
    { pct: total ? Math.round((counts.exceeds / total) * 100) : 0, bg: "bg-foreground" },
    { pct: total ? Math.round((counts.meets / total) * 100) : 0, bg: "bg-secondary-foreground" },
    { pct: total ? Math.round((counts.below / total) * 100) : 0, bg: "bg-muted-foreground" },
    { pct: total ? Math.round((counts.needs / total) * 100) : 0, bg: "bg-muted" },
  ]

  const legend = [
    { swatch: "bg-foreground", label: "Exceeds", count: `${counts.exceeds} · ${total ? Math.round((counts.exceeds / total) * 100) : 0}%` },
    { swatch: "bg-secondary-foreground", label: "Meets", count: `${counts.meets} · ${total ? Math.round((counts.meets / total) * 100) : 0}%` },
    { swatch: "bg-muted-foreground", label: "Below", count: `${counts.below} · ${total ? Math.round((counts.below / total) * 100) : 0}%` },
    { swatch: "bg-muted", label: "Needs improvement", count: `${counts.needs} · ${total ? Math.round((counts.needs / total) * 100) : 0}%` },
  ]

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">
          Rating distribution
        </h2>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
          {currentQuarter()} · {total} review{total !== 1 ? "s" : ""} submitted across all teams
        </span>
      </div>
      <div className="flex h-3.5 w-full overflow-clip rounded-full">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className={`h-full ${seg.bg}`}
            style={{ width: `${seg.pct}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`size-3 shrink-0 rounded ${item.swatch}`} />
            <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-secondary-foreground">
              {item.label}
            </span>
            <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
