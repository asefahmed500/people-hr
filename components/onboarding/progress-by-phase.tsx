import type { OnboardingTask } from "@/lib/data"

type PhaseBar = {
  label: string
  meta: string
  fillPct: number
  fill: string
}

const PHASE_FILLS: Record<string, string> = {
  pre: "bg-primary",
  w1: "bg-secondary-foreground",
  m1: "bg-muted-foreground",
  ramped: "bg-primary",
}

const PHASE_LABELS: Record<string, string> = {
  pre: "Pre-boarding",
  w1: "Week 1",
  m1: "First month",
  ramped: "Fully ramped",
}

export function ProgressByPhase({ tasks }: { tasks: OnboardingTask[] }) {
  const total = tasks.length
  const phaseCounts: Record<string, number> = {}
  for (const t of tasks) {
    phaseCounts[t.phase] = (phaseCounts[t.phase] ?? 0) + 1
  }
  const phases: PhaseBar[] = (
    ["pre", "w1", "m1", "ramped"] as const
  ).map((phase) => {
    const count = phaseCounts[phase] ?? 0
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return {
      label: PHASE_LABELS[phase],
      meta: `${count} · ${pct}%`,
      fillPct: pct,
      fill: PHASE_FILLS[phase],
    }
  })
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-h4">
          Progress by phase
        </h2>
        <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
          {tasks ? `${new Set(tasks.map((t) => t.hireName)).size} people onboarding` : "—"}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {phases.map((phase) => (
          <div key={phase.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-secondary-foreground">
                {phase.label}
              </span>
              <span className="font-sans inline-block text-[11px] font-semibold leading-normal text-muted-foreground">
                {phase.meta}
              </span>
            </div>
            <div className="flex h-1.5 w-full overflow-clip rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${phase.fill}`}
                style={{ width: `${phase.fillPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
