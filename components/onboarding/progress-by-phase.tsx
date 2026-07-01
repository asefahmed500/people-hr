type PhaseBar = {
  label: string
  meta: string
  fillPct: number
  fill: string
}

const phases: PhaseBar[] = [
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

export function ProgressByPhase() {
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
