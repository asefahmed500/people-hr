import type { ID } from "./types"

export type OnboardingTask = {
  id: ID
  hireInit: string
  hireName: string
  hireRole: string
  hireDept: string
  phase: "pre" | "w1" | "m1" | "ramped"
  done: boolean
  label: string
}

export type OnboardingStore = {
  tasks: OnboardingTask[]
}

export const phaseMeta = {
  pre: { number: 1, name: "Pre-boarding", nodeBg: "bg-foreground/10", nodeText: "text-primary" },
  w1: { number: 2, name: "Week 1", nodeBg: "bg-foreground/10", nodeText: "text-secondary-foreground" },
  m1: { number: 3, name: "First month", nodeBg: "bg-foreground/10", nodeText: "text-secondary-foreground" },
  ramped: { number: 4, name: "Fully ramped", nodeBg: "bg-foreground/10", nodeText: "text-primary" },
} as const

export type Phase = keyof typeof phaseMeta

export const phaseOrder: Phase[] = ["pre", "w1", "m1", "ramped"]

export const defaultOnboardingStore: OnboardingStore = {
  tasks: [],
}
