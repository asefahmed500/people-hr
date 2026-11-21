import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

function currentQuarter(): string {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + 1
  return `Q${q} ${now.getFullYear()}`
}

export function GoalsHeader({
  onNewGoal,
}: {
  onNewGoal?: () => void
}) {
  const period = currentQuarter()
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">
          Goals
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-muted-foreground">
          Company objectives and key results Â· {period} cycle
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex items-center rounded-lg border border-border bg-card px-3 py-2">
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            {period}
          </span>
        </span>
        {onNewGoal ? (
          <Button type="button" variant="secondary" onClick={onNewGoal} className="h-9 px-3.5">
            <Plus className="size-3.5 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
            <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              New goal
            </span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
