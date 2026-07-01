import { cn } from "@/lib/utils"

type Stage = {
  name: string
  count: string
  widthPct: number
  bg: string
  textClass: string
}

const stages: Stage[] = [
  {
    name: "Applied",
    count: "96 · 52%",
    widthPct: 100,
    bg: "bg-[#e0663d]",
    textClass: "text-white",
  },
  {
    name: "Screening",
    count: "48 · 26%",
    widthPct: 82,
    bg: "bg-[#e67b58]",
    textClass: "text-white",
  },
  {
    name: "Interview",
    count: "28 · 15%",
    widthPct: 64,
    bg: "bg-[#eb9072]",
    textClass: "text-white",
  },
  {
    name: "Offer",
    count: "12 · 7%",
    widthPct: 46,
    bg: "bg-[#f0a68d]",
    textClass: "text-[#1f2a26]",
  },
  {
    name: "Hired",
    count: "6",
    widthPct: 28,
    bg: "bg-[#f5bba7]",
    textClass: "text-[#1f2a26]",
  },
]

export function PipelineFunnelCard() {
  return (
    <div className="flex flex-1 flex-col gap-5 rounded-[18px] border border-[#edeae3] bg-white p-6">
      <h2 className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
        Candidate pipeline
      </h2>
      <div className="flex w-full flex-col items-center gap-2">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className="flex w-full justify-center"
            style={{ width: `${stage.widthPct}%` }}
          >
            <div
              className={cn(
                "flex h-[52px] w-full items-center justify-between rounded-xl px-5 py-0",
                stage.bg,
              )}
            >
              <span
                className={cn(
                  "font-sans inline-block text-[13px] font-semibold leading-normal",
                  stage.textClass,
                )}
              >
                {stage.name}
              </span>
              <span
                className={cn(
                  "font-sans inline-block text-[13px] font-medium leading-normal",
                  stage.textClass,
                )}
              >
                {stage.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
