import { Sparkles } from "lucide-react"

type Risk = "high" | "medium" | "low"

type RiskRow = {
  team: string
  risk: Risk
  rate: string
}

const riskStyles: Record<Risk, { dot: string; text: string }> = {
  high: { dot: "bg-[#e76f51]", text: "text-[#e76f51]" },
  medium: { dot: "bg-[#f4a261]", text: "text-[#f4a261]" },
  low: { dot: "bg-[#b0b7af]", text: "text-[#5b655e]" },
}

const riskRows: RiskRow[] = [
  { team: "Sales", risk: "high", rate: "12% risk" },
  { team: "Customer Support", risk: "medium", rate: "9% risk" },
  { team: "Marketing", risk: "low", rate: "6% risk" },
]

const prompts = [
  "Summarize this month’s hiring",
  "Who is up for review?",
  "Explain our parental leave policy",
  "Forecast Q2 headcount",
]

export function ChatConversation() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 rounded-[14px] border border-[#e8ebe6] bg-white p-6">
      <div className="flex flex-1 flex-col gap-5">
        <UserMessage text="Which teams have the highest attrition risk this quarter?" />
        <AssistantMessage
          intro="Based on current turnover signals and exit interview patterns, here are the teams with the highest Q1 attrition risk:"
          rows={riskRows}
          followUp="Would you like me to draft a retention plan for any of these teams?"
        />
        <UserMessage text="Drill into Sales — who is most likely to leave?" />
        <AssistantSimple
          text="Looking at Sales specifically, Owen Park and Marcus Bell surface as the two highest flight-risk candidates, both flagged on the basis of compensation gap and engagement pulse drops in the last 60 days."
          followUp="Want me to set up a check-in with Marcus’s manager or pull his comp band comparison?"
        />
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {prompts.map((prompt) => (
          <span
            key={prompt}
            className="flex items-center rounded-full border border-[#e8ebe6] bg-white px-3 py-1.5 font-sans text-[12.5px] leading-normal text-[#42504a]"
          >
            {prompt}
          </span>
        ))}
      </div>
      <ChatInput />
      <span className="text-center font-sans text-[11px] leading-normal text-[#b0b7af]">
        AI can make mistakes. Verify important info.
      </span>
    </div>
  )
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[70%] flex-col rounded-tr bg-[#2f6f61] px-4 py-2.5">
        <span className="font-sans text-[13.5px] leading-[1.55] text-white">
          {text}
        </span>
      </div>
    </div>
  )
}

function AssistantMessage({
  intro,
  rows,
  followUp,
}: {
  intro: string
  rows: RiskRow[]
  followUp: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#2f6f611a]">
        <Sparkles className="size-3.5 text-[#2f6f61]" strokeWidth={1.8} />
      </div>
      <div className="flex max-w-[78%] flex-col gap-2.5 rounded-tl border border-[#e8ebe6] bg-white px-4 py-3">
        <p className="font-sans text-[13.5px] leading-[1.6] text-[#1f2a26]">
          {intro}
        </p>
        <div className="flex flex-col overflow-clip rounded-[10px] border border-[#e8ebe6]">
          <div className="flex items-center justify-between bg-[#f8f7f4] px-3 py-[7px]">
            <span className="font-sans text-[11.5px] font-semibold uppercase leading-normal tracking-[0.6px] text-[#8a948d]">
              Team
            </span>
            <span className="font-sans text-[11.5px] font-semibold uppercase leading-normal tracking-[0.6px] text-[#8a948d]">
              Risk level
            </span>
          </div>
          {rows.map((row) => {
            const s = riskStyles[row.risk]
            return (
              <div
                key={row.team}
                className="flex items-center justify-between border-t border-t-[#f0ede6] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
                  <span className="font-sans text-[13px] font-medium leading-normal text-[#1f2a26]">
                    {row.team}
                  </span>
                </div>
                <span className={`font-sans text-[13px] font-semibold leading-normal ${s.text}`}>
                  {row.rate}
                </span>
              </div>
            )
          })}
        </div>
        <p className="font-sans text-[13px] leading-normal text-[#5b655e]">
          {followUp}
        </p>
      </div>
    </div>
  )
}

function AssistantSimple({ text, followUp }: { text: string; followUp: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#2f6f611a]">
        <Sparkles className="size-3.5 text-[#2f6f61]" strokeWidth={1.8} />
      </div>
      <div className="flex max-w-[78%] flex-col gap-2.5 rounded-tl border border-[#e8ebe6] bg-white px-4 py-3">
        <p className="font-sans text-[13.5px] leading-[1.6] text-[#1f2a26]">
          {text}
        </p>
        <p className="font-sans text-[13px] leading-normal text-[#5b655e]">
          {followUp}
        </p>
      </div>
    </div>
  )
}

function ChatInput() {
  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-[12px] border border-[#e8ebe6] bg-white px-3.5 py-2.5">
      <PaperclipIcon />
      <span className="flex-1 font-sans text-[13.5px] leading-normal text-[#b0b7af]">
        Ask AetherPeople AI anything…
      </span>
      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e8ebe6] bg-[#f8f7f4] px-2.5 py-1">
        <span className="size-1.5 rounded-full bg-[#2f6f61]" />
        <span className="font-sans text-[11px] font-semibold leading-normal text-[#5b655e]">
          Claude 4.7
        </span>
      </span>
      <button
        type="button"
        aria-label="Send message"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2f6f61]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 text-white"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22L11 13L2 9L22 2z" />
        </svg>
      </button>
    </div>
  )
}

function PaperclipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-[#8a948d]"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}
