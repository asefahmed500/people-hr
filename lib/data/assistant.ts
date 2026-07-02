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

export const cannedReplies: { match: RegExp; reply: string }[] = [
  {
    match: /attrition|turnover|leave.*sales/i,
    reply:
      "Sales is flagged at 12% attrition risk this quarter, with Marcus Bell and Owen Park as the highest flight-risk candidates. Want me to set up a check-in with Marcus’s manager?",
  },
  {
    match: /hiring|hire|recruit/i,
    reply:
      "Six new hires onboarded in the last 14 days across Design, Engineering and People. Aurora Checkout is the largest open role with 54 applicants.",
  },
  {
    match: /review|performance/i,
    reply:
      "Q1 cycle is 77% complete (218/284 reviews). Average rating is 4.2, up from 3.9 last cycle. Engineering and People lead the leaderboard.",
  },
  {
    match: /payroll|pay|salary/i,
    reply:
      "February pay run is in the Approved step. Net pay is $1.06M for 284 employees. Pay date is Feb 28.",
  },
  {
    match: /leave|pto|vacation/i,
    reply:
      "12 people are on leave today, 5 requests are pending approval. Your vacation balance is 9 days remaining of 24.",
  },
  {
    match: /goal|okr/i,
    reply:
      "4 active company OKRs in Q1. Aurora Checkout 2.0 is 86% complete; P95 latency reduction is at risk at 42%.",
  },
]

export const defaultReply =
  "I can help with people data, policies, hiring, leave, payroll and more. Try asking “Which teams have the highest attrition risk this quarter?” or “Summarize this month’s hiring”."

export function replyFor(input: string): string {
  const found = cannedReplies.find((c) => c.match.test(input))
  return found ? found.reply : defaultReply
}

export const defaultConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Attrition risk in Sales",
    updatedAt: Date.now() - 2 * 3600_000,
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Which teams have the highest attrition risk this quarter?",
        ts: Date.now() - 2 * 3600_000,
      },
      {
        id: "m2",
        role: "assistant",
        content: cannedReplies[0].reply,
        ts: Date.now() - 2 * 3600_000 + 5000,
      },
    ],
  },
  {
    id: "conv-2",
    title: "Draft offer letter",
    updatedAt: Date.now() - 24 * 3600_000,
    messages: [
      {
        id: "m3",
        role: "user",
        content: "Draft an offer letter for a Senior Designer",
        ts: Date.now() - 24 * 3600_000,
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "Here’s a draft offer letter for a Senior Designer. Want me to insert a specific salary band and start date?",
        ts: Date.now() - 24 * 3600_000 + 5000,
      },
    ],
  },
]

export const suggestedPrompts = [
  "Summarize this month’s hiring",
  "Who is up for review?",
  "Explain our parental leave policy",
  "Forecast Q2 headcount",
]

export type AssistantStore = {
  conversations: Conversation[]
  activeId: ID | null
}

export const defaultAssistantStore: AssistantStore = {
  conversations: defaultConversations,
  activeId: defaultConversations[0]?.id ?? null,
}
