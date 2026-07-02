import type { GoalStatus, ID } from "./types"

export type KeyResult = {
  id: ID
  label: string
  pct: number
}

export type Objective = {
  id: ID
  eyebrow: string
  title: string
  ownerInit: string
  ownerName: string
  ownerRole: string
  progress: number
  status: GoalStatus
  krs: KeyResult[]
}

export const statusMeta: Record<
  GoalStatus,
  { dot: string; pillBg: string; pillText: string; label: string; bar: string }
> = {
  "on-track": {
    dot: "bg-[#2f6f61]",
    pillBg: "bg-[#2f6f611a]",
    pillText: "text-[#2f6f61]",
    label: "On track",
    bar: "bg-[#2f6f61]",
  },
  "at-risk": {
    dot: "bg-[#d98a2b]",
    pillBg: "bg-[#d98a2b1a]",
    pillText: "text-[#b26a1f]",
    label: "At risk",
    bar: "bg-[#d98a2b]",
  },
  completed: {
    dot: "bg-[#2e9160]",
    pillBg: "bg-[#3bb27326]",
    pillText: "text-[#2e9160]",
    label: "Completed",
    bar: "bg-[#2e9160]",
  },
}

export function deriveStatus(progress: number): GoalStatus {
  if (progress >= 100) return "completed"
  if (progress < 50) return "at-risk"
  return "on-track"
}

export const defaultGoals: Objective[] = [
  {
    id: "g-arr",
    eyebrow: "Company OKR · Revenue",
    title: "Grow ARR to $24M",
    ownerInit: "MB",
    ownerName: "Marcus Bailey",
    ownerRole: "Chief Revenue Officer",
    progress: 72,
    status: "on-track",
    krs: [
      { id: "k-arr-1", label: "Close $6.2M new logo", pct: 81 },
      { id: "k-arr-2", label: "Expansion ARR $3.4M", pct: 64 },
      { id: "k-arr-3", label: "Net retention 118%", pct: 70 },
    ],
  },
  {
    id: "g-aurora",
    eyebrow: "Company OKR · Product",
    title: "Ship Aurora Checkout 2.0",
    ownerInit: "HL",
    ownerName: "Hana Lindqvist",
    ownerRole: "Chief Product Officer",
    progress: 86,
    status: "on-track",
    krs: [
      { id: "k-auro-1", label: "Beta with 20 customers", pct: 100 },
      { id: "k-auro-2", label: "GA launch by Mar 14", pct: 92 },
      { id: "k-auro-3", label: "NPS +8 points", pct: 66 },
    ],
  },
  {
    id: "g-latency",
    eyebrow: "Company OKR · Engineering",
    title: "Reduce P95 latency to 180ms",
    ownerInit: "DO",
    ownerName: "Daniel Okafor",
    ownerRole: "VP Engineering",
    progress: 42,
    status: "at-risk",
    krs: [
      { id: "k-lat-1", label: "Cache layer rollout", pct: 64 },
      { id: "k-lat-2", label: "Query optimization", pct: 38 },
      { id: "k-lat-3", label: "Region edge nodes", pct: 24 },
    ],
  },
  {
    id: "g-engage",
    eyebrow: "Company OKR · People",
    title: "Lift engagement to 8.4",
    ownerInit: "LF",
    ownerName: "Lena Fischer",
    ownerRole: "Director of People",
    progress: 100,
    status: "completed",
    krs: [
      { id: "k-eng-1", label: "Engagement survey complete", pct: 100 },
      { id: "k-eng-2", label: "Manager training 95%", pct: 100 },
      { id: "k-eng-3", label: "Recognition program live", pct: 100 },
    ],
  },
]

export type GoalsStore = { objectives: Objective[] }

export const defaultGoalsStore: GoalsStore = { objectives: defaultGoals }

export const newObjective = (input: {
  title: string
  ownerName: string
  ownerRole: string
}): Objective => ({
  id: `g-${Math.random().toString(36).slice(2, 9)}`,
  eyebrow: "Company OKR · New",
  title: input.title,
  ownerInit: input.ownerName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
  ownerName: input.ownerName,
  ownerRole: input.ownerRole,
  progress: 0,
  status: "on-track",
  krs: [],
})
