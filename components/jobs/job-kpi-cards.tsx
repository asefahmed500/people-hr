import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type JobKpiCardsProps = {
  queued: number
  running: number
  succeeded: number
  failed: number
}

type CardSpec = {
  key: string
  label: string
  value: number
  sub: string
  icon: LucideIcon
  iconTone: string
}

export function JobKpiCards({
  queued,
  running,
  succeeded,
  failed,
}: JobKpiCardsProps) {
  const cards: CardSpec[] = [
    {
      key: "queued",
      label: "Queued",
      value: queued,
      sub: "Waiting to be picked up",
      icon: Clock3,
      iconTone: "bg-muted text-muted-foreground",
    },
    {
      key: "running",
      label: "Running",
      value: running,
      sub: "Currently in progress",
      icon: Loader2,
      iconTone: "bg-foreground/10 text-primary",
    },
    {
      key: "succeeded",
      label: "Succeeded",
      value: succeeded,
      sub: "Completed successfully",
      icon: CheckCircle2,
      iconTone: "bg-foreground/10 text-foreground",
    },
    {
      key: "failed",
      label: "Failed / dead",
      value: failed,
      sub: "Needs a retry",
      icon: AlertTriangle,
      iconTone: "bg-foreground text-background",
    },
  ]

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.key}
            className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans inline-block text-xs font-medium leading-normal text-muted-foreground">
                {card.label}
              </span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  card.iconTone,
                )}
              >
                <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
              </span>
            </div>
            <span className="font-sans inline-block text-[26px] font-semibold leading-none text-foreground">
              {card.value}
            </span>
            <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
              {card.sub}
            </span>
          </div>
        )
      })}
    </div>
  )
}
