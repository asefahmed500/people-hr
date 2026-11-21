import * as React from "react"
import { BotMessageSquare, ChevronRight } from "lucide-react"

import type { Employee, ProjectTask, Candidate, LeaveRequest } from "@/lib/data"
import type { Objective } from "@/lib/data/goals"
import type { Review } from "@/lib/data/performance"

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
  leaveRequests = [],
  objectives = [],
  reviews = [],
}: {
  onOpenAssistant?: () => void
  employees?: Employee[]
  projects?: ProjectTask[]
  candidates?: Candidate[]
  leaveRequests?: LeaveRequest[]
  objectives?: Objective[]
  reviews?: Review[]
}) {
  const insights: Insight[] = []
  const [now] = React.useState(() => Date.now())

  // Offers pending
  const offers = candidates.filter((c) => c.stage === "offer").length
  if (offers > 0) {
    insights.push({
      tone: "amber",
      title: `${offers} offer${offers === 1 ? "" : "s"} awaiting acceptance`,
      desc: "Follow up with candidates in the offer stage to keep momentum.",
    })
  }

  // At-risk projects
  const flagged = projects.filter((p) => p.status === "at-risk" || p.status === "delayed")
  if (flagged.length > 0) {
    insights.push({
      tone: "coral",
      title: `${flagged.length} project${flagged.length === 1 ? "" : "s"} off track`,
      desc: flagged[0]
        ? `"${flagged[0].name}" needs attention this week.`
        : "Review owners and due dates to get them back on track.",
    })
  }

  // New hires onboarding
  const newHires = employees.filter((e) => e.hiredDaysAgo <= 14)
  if (newHires.length > 0) {
    insights.push({
      tone: "forest",
      title: `${newHires.length} new hire${newHires.length === 1 ? "" : "s"} onboarding`,
      desc: "Check their onboarding tasks are on schedule.",
    })
  }

  // Stale candidates (>14 days in stage)
  const staleCandidates = candidates.filter(
    (c) =>
      c.stage !== "hired" &&
      new Date(c.appliedAt).getTime() < now - 14 * 86400_000,
  )
  if (staleCandidates.length > 0) {
    insights.push({
      tone: "amber",
      title: `${staleCandidates.length} candidate${staleCandidates.length === 1 ? "" : "s"} in pipeline > 2 weeks`,
      desc: "Review candidates who haven't progressed to avoid losing talent.",
    })
  }

  // Pending leave requests
  const staleLeave = leaveRequests.filter(
    (r) => r.status === "pending",
  )
  if (staleLeave.length > 0) {
    insights.push({
      tone: "coral",
      title: `${staleLeave.length} leave request${staleLeave.length === 1 ? "" : "s"} awaiting approval`,
      desc: "Delayed approvals reduce team trust. Review pending requests.",
    })
  }

  // Overdue goals
  const overdueGoals = objectives.filter(
    (o) => o.deadline && new Date(o.deadline) < new Date() && o.progress < 100,
  )
  if (overdueGoals.length > 0) {
    insights.push({
      tone: "coral",
      title: `${overdueGoals.length} goal${overdueGoals.length === 1 ? "" : "s"} overdue`,
      desc: overdueGoals[0]
        ? `"${overdueGoals[0].title}" was due ${overdueGoals[0].deadline}.`
        : "Review and reprioritize overdue objectives.",
    })
  }

  // Goals approaching deadline with low progress
  const urgentGoals = objectives.filter((o) => {
    if (!o.deadline || o.progress >= 100) return false;
    const daysLeft = Math.ceil(
      (new Date(o.deadline).getTime() - now) / 86400_000,
    );
    return daysLeft <= 7 && daysLeft >= 0 && o.progress < 50;
  })
  if (urgentGoals.length > 0) {
    insights.push({
      tone: "amber",
      title: `${urgentGoals.length} goal${urgentGoals.length === 1 ? "" : "s"} due soon with < 50% progress`,
      desc: "Consider reprioritizing or adding resources to meet deadlines.",
    })
  }

  // Reviews needing attention (low ratings)
  const needsAttentionReviews = reviews.filter(
    (r) => r.status === "below" || r.status === "needs",
  )
  if (needsAttentionReviews.length > 0) {
    insights.push({
      tone: "amber",
      title: `${needsAttentionReviews.length} review${needsAttentionReviews.length === 1 ? "" : "s"} flagged for development`,
      desc: "Consider scheduling follow-up conversations for employees with below-expectations ratings.",
    })
  }

  // High attrition risk (employees with low tenure + inactive status)
  const departed = employees.filter((e) => e.status === "inactive").length
  if (departed > 0 && employees.length > 0) {
    const rate = (departed / employees.length) * 100
    if (rate > 10) {
      insights.push({
        tone: "coral",
        title: `Attrition rate at ${rate.toFixed(0)}%`,
        desc: `${departed} employees have departed. Consider retention strategies.`,
      })
    }
  }

  // Active headcount growth Ã¢â‚¬â€ prefer the absolute hire date so this keeps
  // working months after an employee was added.
  const thisMonth = employees.filter((e) => {
    if (e.hiredAt) {
      const d = new Date(e.hiredAt)
      return d.getFullYear() === new Date().getFullYear() && d.getMonth() === new Date().getMonth()
    }
    return e.hiredDaysAgo <= 30
  }).length
  if (thisMonth >= 3) {
    insights.push({
      tone: "forest",
      title: `${thisMonth} new hires this month`,
      desc: "Strong growth! Ensure onboarding capacity keeps pace.",
    })
  }

  if (insights.length === 0) {
    insights.push({
      tone: "forest",
      title: "Everything looks on track",
      desc: "No pending actions, no overdue items, and all metrics are healthy.",
    })
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-3.5 rounded-lg border border-border bg-card p-4 sm:w-[380px]">
      <div className="flex items-center gap-[9px]">
        <div className="flex size-[30px] items-center justify-center rounded-lg bg-foreground/10">
          <BotMessageSquare className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
          Smart insights
        </h2>
      </div>
      <div className="flex flex-col gap-2.5">
        {insights.slice(0, 6).map((insight, idx) => (
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
        className="mt-0.5 mb-0 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-foreground/10 transition-colors hover:bg-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="font-sans text-[13px] font-semibold leading-normal text-primary">
          Open AI Assistant
        </span>
        <ChevronRight className="size-[15px] text-primary" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}
