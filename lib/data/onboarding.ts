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
  pre: { number: 1, name: "Pre-boarding", nodeBg: "bg-[#0f9b8e1a]", nodeText: "text-[#2f6f61]" },
  w1: { number: 2, name: "Week 1", nodeBg: "bg-[#64b6ac1a]", nodeText: "text-[#3e9488]" },
  m1: { number: 3, name: "First month", nodeBg: "bg-[#f4a26126]", nodeText: "text-[#b96a2c]" },
  ramped: { number: 4, name: "Fully ramped", nodeBg: "bg-[#0f9b8e1a]", nodeText: "text-[#2f6f61]" },
} as const

export type Phase = keyof typeof phaseMeta

export const defaultOnboardingStore: OnboardingStore = {
  tasks: [
    { id: "ob-1", hireInit: "SA", hireName: "Sofia Alvarez", hireRole: "Sr Product Designer", hireDept: "Design", phase: "pre", done: true, label: "Paperwork received" },
    { id: "ob-2", hireInit: "SA", hireName: "Sofia Alvarez", hireRole: "Sr Product Designer", hireDept: "Design", phase: "pre", done: false, label: "Hardware shipped" },
    { id: "ob-3", hireInit: "PN", hireName: "Priya Nair", hireRole: "Platform Engineer", hireDept: "Engineering", phase: "pre", done: true, label: "Paperwork received" },
    { id: "ob-4", hireInit: "DO", hireName: "Daniel Okafor", hireRole: "Backend Engineer", hireDept: "Engineering", phase: "w1", done: true, label: "Day 1 orientation" },
    { id: "ob-5", hireInit: "DO", hireName: "Daniel Okafor", hireRole: "Backend Engineer", hireDept: "Engineering", phase: "w1", done: false, label: "Dev environment setup" },
    { id: "ob-6", hireInit: "LF", hireName: "Lena Fischer", hireRole: "HR Specialist", hireDept: "People", phase: "w1", done: true, label: "Buddy assigned" },
    { id: "ob-7", hireInit: "MB", hireName: "Marcus Bailey", hireRole: "Account Executive", hireDept: "Sales", phase: "m1", done: false, label: "First deal closed" },
    { id: "ob-8", hireInit: "HL", hireName: "Hana Lindqvist", hireRole: "Product Manager", hireDept: "Product", phase: "m1", done: true, label: "Spec shipped" },
    { id: "ob-9", hireInit: "AC", hireName: "Amara Cole", hireRole: "UX Researcher", hireDept: "Research", phase: "ramped", done: true, label: "Steady state" },
  ],
}
