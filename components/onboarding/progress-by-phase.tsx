import type { OnboardingTask } from "@/lib/data"

type PhaseBar = {
  label: string
  meta: string
  fillPct: number
  fill: string
}

const defaultPhases: PhaseBar[] = [
  {
    label: "Pre-boarding",
    meta: "14 · 24%",
    fillPct: 24,
    fill: "bg-[#0f9b8e]",
  },
  {
    label: "Week 1",
    meta: "22 · 38%",
    fillPct: 38,
    fill: "bg-[#64b6ac]",
  },
  {
    label: "First month",
    meta: "16 · 28%",
    fillPct: 28,
    fill: "bg-[#f4a261]",
  },
  {
    label: "Fully ramped",
    meta: "6 · 10%",
    fillPct: 10,
    fill: "bg-[#0f9b8e]",
  },
]

const PHASE_FILLS: Record<string, string> = {
  pre: "bg-[#0f9b8e]",
  w1: "bg-[#64b6ac]",
  m1: "bg-[#f4a261]",
  ramped: "bg-[#0f9b8e]",
}

const PHASE_LABELS: Record<string, string> = {
  pre: "Pre-boarding",
  w1: "Week 1",
  m1: "First month",
  ramped: "Fully ramped",
}

export function ProgressByPhase({ tasks }: { tasks?: OnboardingTask[] }) {
  const phases: PhaseBar[] = tasks
    ? (() => {
        const total = tasks.length
        const phaseCounts: Record<string, number> = {}
        for (const t of tasks) {
          phaseCounts[t.phase] = (phaseCounts[t.phase] ?? 0) + 1
        }
        return (
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
      })()
    : defaultPhases
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display inline-block text-[15px] font-semibold leading-tight text-[#1f2a26]">
          Progress by phase
        </h2>
        <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
          58 people onboarding
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {phases.map((phase) => (
          <div key={phase.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-[#5b655e]">
                {phase.label}
              </span>
              <span className="font-sans inline-block text-[11px] font-semibold leading-normal text-[#8a948d]">
                {phase.meta}
              </span>
            </div>
            <div className="flex h-1.5 w-full overflow-clip rounded-full bg-[#f1eee8]">
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
