import type { CandidateStage, ID } from "./types"

export type Candidate = {
  id: ID
  name: string
  initials: string
  role: string
  department: string
  appliedAt: string
  stage: CandidateStage
  /** Sourcing channel captured in the candidate dialog. */
  source?: string
}

export type Opening = {
  id: ID
  title: string
  department: string
  location: string
  applicants: number
  postedDaysAgo: number
}

export type RecruitmentStore = {
  candidates: Candidate[]
  openings: Opening[]
}

export const stageOrder: CandidateStage[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
]

export const stageMeta: Record<
  CandidateStage,
  { label: string; dot: string; fill: string; avatarBg: string; avatarText: string }
> = {
  applied: {
    label: "Applied",
    dot: "bg-secondary-foreground",
    fill: "bg-secondary-foreground",
    avatarBg: "bg-foreground/20",
    avatarText: "text-secondary-foreground",
  },
  screening: {
    label: "Screening",
    dot: "bg-secondary-foreground",
    fill: "bg-secondary-foreground",
    avatarBg: "bg-foreground/20",
    avatarText: "text-secondary-foreground",
  },
  interview: {
    label: "Interview",
    dot: "bg-primary",
    fill: "bg-primary",
    avatarBg: "bg-foreground/20",
    avatarText: "text-primary",
  },
  offer: {
    label: "Offer",
    dot: "bg-muted-foreground",
    fill: "bg-muted-foreground",
    avatarBg: "bg-foreground/20",
    avatarText: "text-secondary-foreground",
  },
  hired: {
    label: "Hired",
    dot: "bg-secondary-foreground",
    fill: "bg-secondary-foreground",
    avatarBg: "bg-foreground/20",
    avatarText: "text-secondary-foreground",
  },
}

export const defaultRecruitmentStore: RecruitmentStore = {
  candidates: [],
  openings: [],
}
