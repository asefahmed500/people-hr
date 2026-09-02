"use client"

import { BotMessageSquare } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"

export function GreetingBanner({
  employeeCount,
  pendingLeave = 0,
  departmentCount,
}: {
  employeeCount?: number
  pendingLeave?: number
  departmentCount?: number
}) {
  const { user } = useAuth()
  const userName = user?.name ?? "there"
  const canApprove = user?.role === "admin" || user?.role === "manager"
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" })
  const monthName = now.toLocaleDateString("en-US", { month: "long" })
  const day = now.getDate()
  const dateStr = `${dayName}, ${day} ${monthName}`
  return (
    <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <h1 className="inline-block text-2xl font-semibold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-3xl">
          {greeting}, {userName}
        </h1>
        <p className="font-sans inline-block text-sm leading-normal text-secondary-foreground">
          {dateStr}
          {employeeCount != null
            ? ` — ${employeeCount} people${departmentCount != null ? ` across ${departmentCount} departments` : ""}.`
            : " — here’s how your people are doing today."}
        </p>
      </div>
      <AiInsightCard pendingLeave={canApprove ? pendingLeave : 0} />
    </div>
  )
}

function AiInsightCard({ pendingLeave }: { pendingLeave: number }) {
  const line =
    pendingLeave > 0
      ? `${pendingLeave} leave request${pendingLeave === 1 ? "" : "s"} waiting for your approval.`
      : "You’re all caught up — no pending approvals."
  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[13px] rounded-2xl bg-foreground p-4 shadow-card sm:w-[400px]">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-background/15">
        <BotMessageSquare className="size-[18px] text-background" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-sans inline-block text-[10.5px] font-semibold uppercase leading-normal tracking-[0.09em] text-background/60">
          AI Insight
        </span>
        <p className="font-sans inline-block h-fit w-full text-[13px] leading-[1.45] text-background">
          {line}
        </p>
      </div>
    </div>
  )
}
