"use client"

import { Sparkles } from "lucide-react"

import type { Department } from "@/lib/data"

export function GreetingBanner({
  userName = "Asef Ahmed",
  employeeCount,
}: {
  userName?: string
  employeeCount?: number
}) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" })
  const monthName = now.toLocaleDateString("en-US", { month: "long" })
  const day = now.getDate()
  const dateStr = `${dayName}, ${day} ${monthName}`
  return (
    <div className="flex h-fit w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <h1 className="font-display inline-block text-2xl font-semibold leading-[1.1] tracking-[-0.3px] text-[#1f2a26] sm:text-3xl">
          {greeting}, {userName}
        </h1>
        <p className="font-sans inline-block text-sm leading-normal text-[#6b7770]">
          {dateStr}
          {employeeCount != null ? ` — ${employeeCount} people across 8 departments.` : " — here’s how your people are doing today."}
        </p>
      </div>
      <AiInsightCard />
    </div>
  )
}

function AiInsightCard() {
  return (
    <div className="flex w-[400px] shrink-0 items-start gap-[13px] rounded-[18px] bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(62,_128,_115)_100%)] p-4 shadow-[0px_10px_30px_rgba(47,111,97,0.22)]">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#ffffff26]">
        <Sparkles className="size-[18px] text-white" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-sans inline-block text-[10.5px] font-bold uppercase leading-normal tracking-[1.47px] text-[#bfe3db]">
          AI Insight
        </span>
        <p className="font-sans inline-block h-fit w-full text-[13px] leading-[1.45] text-white">
          Attendance dipped 3% in Design. Two members are on approved leave —
          no action needed.
        </p>
      </div>
    </div>
  )
}
