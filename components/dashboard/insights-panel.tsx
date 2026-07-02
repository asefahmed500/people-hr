import { ChevronRight, Sparkles } from "lucide-react"

type Insight = {
  tone: "amber" | "coral" | "forest"
  title: string
  desc: string
}

const insights: Insight[] = [
  {
    tone: "amber",
    title: "3 offers awaiting approval",
    desc: "Engineering pipeline is stalling at offer stage.",
  },
  {
    tone: "coral",
    title: "Design team over capacity",
    desc: "Consider redistributing 2 active projects.",
  },
  {
    tone: "forest",
    title: "12 anniversaries this week",
    desc: "Send recognition to boost engagement.",
  },
]

const dotColor: Record<Insight["tone"], string> = {
  amber: "bg-[#f4a261]",
  coral: "bg-[#e76f51]",
  forest: "bg-[#3bb273]",
}

export function InsightsPanel({ onOpenAssistant }: { onOpenAssistant?: () => void }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-3.5 rounded-[18px] border border-[#ece9e2] bg-white p-[22px] shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)] sm:w-[380px]">
      <div className="flex items-center gap-[9px]">
        <div className="flex size-[30px] items-center justify-center rounded-[9px] bg-[#64b6ac24]">
          <Sparkles className="size-4 text-[#3e9488]" strokeWidth={2} />
        </div>
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
          AI recommendations
        </h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="flex items-start gap-[11px] rounded-[13px] border border-[#efede6] bg-[#f8f7f4] p-[13px]"
          >
            <span
              className={`mt-[5px] size-2 shrink-0 rounded-full ${dotColor[insight.tone]}`}
            />
            <div className="flex flex-col gap-0.5">
              <div className="font-sans inline-block text-[13px] font-semibold leading-[1.35] text-[#1f2a26]">
                {insight.title}
              </div>
              <div className="font-sans inline-block text-xs leading-[1.4] text-[#8a948d]">
                {insight.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenAssistant}
        className="mt-0.5 mb-0 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2f6f6114] hover:bg-[#2f6f6124]"
      >
        <span className="font-sans text-[13px] font-semibold leading-normal text-[#2f6f61]">
          Open AI Assistant
        </span>
        <ChevronRight className="size-[15px] text-[#2f6f61]" strokeWidth={2} />
      </button>
    </div>
  )
}
