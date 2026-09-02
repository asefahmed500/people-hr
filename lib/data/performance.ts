import type { Department, ID, ReviewStatus } from "./types"

export type Review = {
  id: ID
  initials: string
  avatarBg: string
  name: string
  role: string
  deptDot: string
  department: Department
  reviewer: string
  rating: number
  status: ReviewStatus
  comments?: string
  reviewedAt?: string
  /** e.g. "Q3 2026" — which cycle the review belongs to. */
  period?: string
}

export const reviewStatusStyles: Record<
  ReviewStatus,
  { bg: string; text: string; label: string }
> = {
  exceeds: { bg: "bg-foreground/10", text: "text-foreground", label: "Exceeds" },
  meets: { bg: "bg-foreground/10", text: "text-primary", label: "Meets" },
  below: { bg: "bg-foreground/10", text: "text-secondary-foreground", label: "Below" },
  needs: {
    bg: "bg-foreground/10",
    text: "text-foreground",
    label: "Needs improvement",
  },
}

export const defaultReviews: Review[] = []

export type TeamRow = {
  rank: number
  dot: string
  team: Department
  reviewed: string
  fillPct: number
  fill: string
  rating: string
  rankBg: string
  rankText: string
}

export const defaultTeamRows: TeamRow[] = []

export type PerformanceStore = {
  reviews: Review[]
  teamScores: TeamRow[]
}

export const defaultPerformanceStore: PerformanceStore = {
  reviews: defaultReviews,
  teamScores: defaultTeamRows,
}
