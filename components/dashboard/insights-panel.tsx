import { BotMessageSquare, ChevronRight } from "lucide-react"

import type { Employee, ProjectTask, Candidate } from "@/lib/data"

type Insight = {
  tone: "amber" | "coral" | "forest"
  title: string
  desc: string
}

const dotColor: Record<Insight["tone"], string> = {
  amber: "bg-muted-foreground",
  coral: "bg-foreground",
  forest: "bg-secondary-foreground",
}

export function InsightsPanel({
  onOpenAssistant,
  employees = [],
  projects = [],
  candidates = [],
}: {
  onOpenAssistant?: () => void
  employees?: Employee[]
  projects?: ProjectTask[]
  candidates?: Candidate[]
}) {
  const insights: Insight[] = []

  const offers = candidates.filter((c) => c.stage === "offer").length
  if (offers > 0) {
    insights.push({
      tone: "amber",
      title: `${offers} offer${offers === 1 ? "" : "s"} awaiting acceptance`,
      desc: "Follow up with candidates in the offer stage to keep momentum.",
    })
  }

  const flagged = projects.filter((p) => p.status === "at-risk" || p.status === "delayed")
  if (flagged.length > 0) {
    insights.push({
      tone: "coral",
      title: `${flagged.length} project${flagged.length === 1 ? "" : "s"} off track`,
      desc: flagged[0]
        ? `“${flagged[0].name}” needs attention this week.`
        : "Review owners and due dates to get them back on track.",
    })
  }

  const newHires = employees.filter((e) => e.hiredDaysAgo <= 14)
  if (newHires.length > 0) {
    insights.push({
      tone: "forest",
      title: `${newHires.length} new hire${newHires.length === 1 ? "" : "s"} onboarding`,
      desc: "Check their onboarding tasks are on schedule.",
    })
  }

  if (insights.length === 0) {
    insights.push({
      tone: "forest",
      title: "Everything looks on track",
      desc: "No offers pending, no projects flagged and no new hires this month.",
    })
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px] shadow-card sm:w-[380px]">
      <div className="flex items-center gap-[9px]">
        <div className="flex size-[30px] items-center justify-center rounded-lg bg-foreground/10">
          <BotMessageSquare className="size-4 text-secondary-foreground" strokeWidth={2} />
        </div>
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
          AI recommendations
        </h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="flex items-start gap-[11px] rounded-xl border border-border bg-muted p-[13px]"
          >
            <span
              className={`mt-[5px] size-2 shrink-0 rounded-full ${dotColor[insight.tone]}`}
            />
            <div className="flex flex-col gap-0.5">
              <div className="font-sans inline-block text-[13px] font-semibold leading-[1.35] text-foreground">
                {insight.title}
              </div>
              <div className="font-sans inline-block text-xs leading-[1.4] text-muted-foreground">
                {insight.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenAssistant}
        className="mt-0.5 mb-0 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-foreground/10 transition-colors hover:bg-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="font-sans text-[13px] font-semibold leading-normal text-primary">
          Open AI Assistant
        </span>
        <ChevronRight className="size-[15px] text-primary" strokeWidth={2} />
      </button>
    </div>
  )
}
