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
    <div className="flex flex-1 flex-col gap-5 rounded-[18px] border border-[#edeae3] bg-white p-6">
      <h2 className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
        Candidate pipeline
      </h2>
      <div className="flex w-full flex-col items-center gap-2">
        {rows.map((row) => {
          const meta = stageMeta[row.stage]
          const isLight = row.stage === "offer" || row.stage === "hired"
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
                <span
                  className={cn(
                    "font-sans inline-block text-[13px] font-semibold leading-normal",
                    isLight ? "text-[#1f2a26]" : "text-white",
                  )}
                >
                  {meta.label}
                </span>
                <span
                  className={cn(
                    "font-sans inline-block text-[13px] font-medium leading-normal",
                    isLight ? "text-[#1f2a26]" : "text-white",
                  )}
                >
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
