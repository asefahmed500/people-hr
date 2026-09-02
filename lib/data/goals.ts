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
  deadline?: string
  description?: string
}

export const statusMeta: Record<
  GoalStatus,
  { dot: string; pillBg: string; pillText: string; label: string; bar: string }
> = {
  "on-track": {
    dot: "bg-primary",
    pillBg: "bg-foreground/10",
    pillText: "text-primary",
    label: "On track",
    bar: "bg-primary",
  },
  "at-risk": {
    dot: "bg-secondary-foreground",
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    label: "At risk",
    bar: "bg-secondary-foreground",
  },
  completed: {
    dot: "bg-primary",
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    label: "Completed",
    bar: "bg-primary",
  },
}

export function deriveStatus(progress: number): GoalStatus {
  if (progress >= 100) return "completed"
  if (progress < 50) return "at-risk"
  return "on-track"
}

export const defaultGoals: Objective[] = []

export type GoalsStore = { objectives: Objective[] }

export const defaultGoalsStore: GoalsStore = { objectives: defaultGoals }

export const newObjective = (input: {
  title: string
  ownerName: string
  ownerRole: string
  deadline?: string
  description?: string
}): Objective => {
  const progress = 0
  return {
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
    progress,
    status: deriveStatus(progress),
    krs: [],
    deadline: input.deadline || undefined,
    description: input.description || undefined,
  }
}