export const STORAGE_KEYS = {
  employees: "peoplehr:employees",
  leave: "peoplehr:leave",
  recruitment: "peoplehr:recruitment",
  projects: "peoplehr:projects",
  goals: "peoplehr:goals",
  payroll: "peoplehr:payroll",
  performance: "peoplehr:performance",
  onboarding: "peoplehr:onboarding",
  attendance: "peoplehr:attendance",
  assistant: "peoplehr:assistant",
  organization: "peoplehr:organization",
  settings: "peoplehr:settings",
  analytics: "peoplehr:analytics",
  reports: "peoplehr:reports",
  notifications: "peoplehr:notifications",
} as const

export * from "./types"
export * from "./employees"
export * from "./leave"
export * from "./recruitment"
export * from "./projects"
export * from "./goals"
export * from "./payroll"
export * from "./performance"
export * from "./onboarding"
export * from "./attendance"
export * from "./organization"
export * from "./assistant"
export * from "./settings"
export * from "./analytics"
export * from "./reports"
export * from "./notifications"
