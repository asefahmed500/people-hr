import type { ID } from "./types"

export type ChatRole = "user" | "assistant"

export type ChatMessage = {
  id: ID
  role: ChatRole
  content: string
  ts: number
}

export type Conversation = {
  id: ID
  title: string
  updatedAt: number
  messages: ChatMessage[]
}

export type PeopleContext = {
  headcount: number
  onLeaveToday: number
  pendingLeave: number
  recentHires: number
  openRoles: number
  applicants: number
  reviewsSubmitted: number
  reviewsTotal: number
  avgRating: number
  pendingPayments: number
  payRunDate: string | null
  activeObjectives: number
}

export const defaultReply =
  "I can help with people data, policies, hiring, leave, payroll and more. Try asking “Which teams have the highest attrition risk this quarter?” or “Summarize this month’s hiring”."

export function replyFor(input: string, ctx?: PeopleContext): string {
  const c = ctx
  const n = (v: number | undefined, fallback: string) =>
    typeof v === "number" ? String(v) : fallback

  const replies: { match: RegExp; reply: string }[] = [
    {
      match: /attrition|turnover|leave.*sales/i,
      reply: c
        ? `${n(c.onLeaveToday, "a number of")} people are on leave today. ${n(c.pendingLeave, "Some")} leave requests are pending approval.`
        : "I don't have enough data to answer that yet — try again once your workspace has leave records.",
    },
    {
      match: /hiring|hire|recruit/i,
      reply: c
        ? `${n(c.recentHires, "Several")} hires onboarded recently. ${n(c.openRoles, "Some")} roles are open with ${n(c.applicants, "a number of")} applicants in the pipeline.`
        : "I don't have enough data to answer that yet — try again once your workspace has hiring records.",
    },
    {
      match: /review|performance/i,
      reply: c
        ? `${n(c.reviewsSubmitted, "Some")} of ${n(c.reviewsTotal, "your")} reviews are submitted, averaging ${(c.avgRating ?? 0).toFixed(1)}.`
        : "I don't have enough data to answer that yet — try again once your workspace has performance reviews.",
    },
    {
      match: /payroll|pay|salary/i,
      reply: c
        ? c.payRunDate
          ? `The last payroll run was ${new Date(c.payRunDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. ${n(c.pendingPayments, "Some")} payments are still pending.`
          : `${n(c.pendingPayments, "Some")} payments are awaiting a payroll run.`
        : "I don't have enough data to answer that yet — try again once your workspace has payroll records.",
    },
    {
      match: /leave|pto|vacation/i,
      reply: c
        ? `${n(c.onLeaveToday, "A number of")} people are on leave today, ${n(c.pendingLeave, "some")} requests are pending approval.`
        : "I don't have enough data to answer that yet — try again once your workspace has leave records.",
    },
    {
      match: /goal|okr/i,
      reply: c
        ? `There ${c.activeObjectives === 1 ? "is" : "are"} ${n(c.activeObjectives, "some")} active objective${c.activeObjectives === 1 ? "" : "s"} in this cycle.`
        : "I don't have enough data to answer that yet — try again once your workspace has goals.",
    },
  ]

  const found = replies.find((r) => r.match.test(input))
  return found ? found.reply : defaultReply
}


export const defaultConversations: Conversation[] = []


export const suggestedPrompts = [
  "Summarize this month’s hiring",
  "Who is up for review?",
  "Explain our parental leave policy",
  "Forecast next quarter’s headcount",
]

export type AssistantStore = {
  conversations: Conversation[]
  activeId: ID | null
}

export const defaultAssistantStore: AssistantStore = {
  conversations: defaultConversations,
  activeId: defaultConversations[0]?.id ?? null,
}