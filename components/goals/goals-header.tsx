import { Plus } from "lucide-react"

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
          Company objectives and key results · {period} cycle
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex items-center rounded-lg border border-border bg-card px-3 py-2">
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            {period}
          </span>
        </span>
        {onNewGoal ? (
          <button
            type="button"
            onClick={onNewGoal}
            className="flex items-center gap-1.5 rounded-lg gap-1.5 rounded-lg px-3.5 py-2 border border-border bg-gradient-to-b from-white to-[#ececea] shadow-xs transition-colors hover:to-[#e2e2df]"
          >
            <Plus className="size-3.5 text-secondary-foreground" strokeWidth={2} />
            <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              New goal
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
