export type ID = string

export const DEPARTMENTS = [
  "Engineering", "Design", "Product", "Sales", "Marketing", "People", "Research", "Finance",
] as const

export type Department = (typeof DEPARTMENTS)[number]

export type LeaveType = "vac" | "sick" | "pers" | "par"

export type LeaveStatus = "approved" | "pending" | "declined"

export type CandidateStage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"

export type ProjectStatus = "on-track" | "at-risk" | "delayed" | "on-hold"

export type GoalStatus = "on-track" | "at-risk" | "completed"

export type PaymentStatus = "paid" | "pending" | "failed"

export type ReviewStatus = "exceeds" | "meets" | "below" | "needs"
