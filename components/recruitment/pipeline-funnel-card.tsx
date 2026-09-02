import { stageMeta, stageOrder, type Candidate } from "@/lib/data"
import { cn } from "@/lib/utils"

export function PipelineFunnelCard({ candidates }: { candidates: Candidate[] }) {
  const total = candidates.length || 1
  const rows = stageOrder.map((stage) => {
    const list = candidates.filter((c) => c.stage === stage)
    return {
      stage,
      count: list.length,
      pct: Math.round((list.length / total) * 100),
    }
  })

  const widths: Record<typeof stageOrder[number], number> = {
    applied: 100,
    screening: 82,
    interview: 64,
    offer: 46,
    hired: 28,
  }

  return (
    <div className="flex flex-1 flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-h3">
        Candidate pipeline
      </h2>
      <div className="flex w-full flex-col items-center gap-2">
        {rows.map((row) => {
          const meta = stageMeta[row.stage]
          return (
            <div
              key={row.stage}
              className="flex w-full justify-center"
              style={{ width: `${widths[row.stage]}%` }}
            >
              <div
                className={cn(
                  "flex h-[52px] w-full items-center justify-between rounded-xl px-5 py-0",
                  meta.fill,
                )}
              >
                <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-background">
                  {meta.label}
                </span>
                <span className="font-sans inline-block text-[13px] font-medium leading-normal text-background">
                  {row.count} · {row.pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
