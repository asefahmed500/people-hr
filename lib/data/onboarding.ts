import type { Employee } from "./employees"
import type { ID } from "./types"

export type OnboardingTask = {
  id: ID
  /** Stable link to the directory row. Hires without one fall back to name. */
  employeeId?: ID
  /** Verified email so a hire can see their checklist after signing in. */
  hireEmail?: string
  hireInit: string
  hireName: string
  hireRole: string
  hireDept: string
  phase: "pre" | "w1" | "m1" | "ramped"
  done: boolean
  label: string
  /** Suggested due date (YYYY-MM-DD) derived from the hire date. */
  dueAt?: string
  completedAt?: string
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

/** The standard checklist every new hire gets. Offsets are days from hire. */
export const ONBOARDING_TEMPLATE: ReadonlyArray<{
  phase: Phase
  label: string
  dueInDays: number
}> = [
  { phase: "pre", label: "Signed offer returned", dueInDays: -3 },
  { phase: "pre", label: "Identity & tax forms submitted", dueInDays: -1 },
  { phase: "pre", label: "Laptop and accounts provisioned", dueInDays: 0 },
  { phase: "w1", label: "Team introduction and buddy assigned", dueInDays: 3 },
  { phase: "w1", label: "First-week manager check-in", dueInDays: 5 },
  { phase: "m1", label: "30-day goals agreed", dueInDays: 30 },
  { phase: "m1", label: "First-month review scheduled", dueInDays: 30 },
  { phase: "ramped", label: "Probation review completed", dueInDays: 90 },
]

/** Generate a real checklist for a hire, keyed by employee id so ownership is stable. */
export function buildOnboardingChecklist(employee: Employee, hiredAt = new Date()): OnboardingTask[] {
  const base = hiredAt.getTime()
  return ONBOARDING_TEMPLATE.map((step, index) => ({
    id: `onb-${employee.id}-${index}`,
    employeeId: employee.id,
    hireEmail: employee.email || undefined,
    hireInit: employee.initials,
    hireName: employee.name,
    hireRole: employee.role,
    hireDept: employee.department,
    phase: step.phase,
    done: false,
    label: step.label,
    dueAt: new Date(base + step.dueInDays * 86_400_000).toISOString().slice(0, 10),
  }))
}

/** Progress for one hire, derived from tasks rather than stored as a counter. */
export function onboardingProgress(tasks: OnboardingTask[], employeeId?: ID) {
  const mine = employeeId ? tasks.filter((t) => t.employeeId === employeeId) : tasks
  const done = mine.filter((t) => t.done).length
  return {
    done,
    total: mine.length,
    pct: mine.length ? Math.round((done / mine.length) * 100) : 0,
    byPhase: phaseOrder.map((phase) => {
      const rows = mine.filter((t) => t.phase === phase)
      return {
        phase,
        done: rows.filter((t) => t.done).length,
        total: rows.length,
      }
    }),
  }
}
