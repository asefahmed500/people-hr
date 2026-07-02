import type { CandidateStage, ID } from "./types"

export type Candidate = {
  id: ID
  name: string
  initials: string
  role: string
  department: string
  appliedAt: string
  stage: CandidateStage
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
    dot: "bg-[#7ba88c]",
    fill: "bg-[#7ba88c]",
    avatarBg: "bg-[#7ba88c33]",
    avatarText: "text-[#548468]",
  },
  screening: {
    label: "Screening",
    dot: "bg-[#64b6ac]",
    fill: "bg-[#64b6ac]",
    avatarBg: "bg-[#64b6ac33]",
    avatarText: "text-[#3e9488]",
  },
  interview: {
    label: "Interview",
    dot: "bg-[#2f6f61]",
    fill: "bg-[#2f6f61]",
    avatarBg: "bg-[#2f6f6133]",
    avatarText: "text-[#2f6f61]",
  },
  offer: {
    label: "Offer",
    dot: "bg-[#f4a261]",
    fill: "bg-[#f4a261]",
    avatarBg: "bg-[#f4a26133]",
    avatarText: "text-[#c67934]",
  },
  hired: {
    label: "Hired",
    dot: "bg-[#3bb273]",
    fill: "bg-[#3bb273]",
    avatarBg: "bg-[#3bb27333]",
    avatarText: "text-[#2e9160]",
  },
}

export const defaultRecruitmentStore: RecruitmentStore = {
  candidates: [
    {
      id: "c-rhea",
      name: "Rhea Watson",
      initials: "RW",
      role: "Data Analyst",
      department: "Engineering",
      appliedAt: "2d ago",
      stage: "applied",
    },
    {
      id: "c-jonas",
      name: "Jonas Meyer",
      initials: "JM",
      role: "QA Engineer",
      department: "Engineering",
      appliedAt: "3d ago",
      stage: "applied",
    },
    {
      id: "c-amara",
      name: "Amara Cole",
      initials: "AC",
      role: "UX Researcher",
      department: "Research",
      appliedAt: "4d ago",
      stage: "screening",
    },
    {
      id: "c-diego",
      name: "Diego Park",
      initials: "DP",
      role: "iOS Engineer",
      department: "Engineering",
      appliedAt: "5d ago",
      stage: "screening",
    },
    {
      id: "c-hana",
      name: "Hana Lindqvist",
      initials: "HL",
      role: "Product Manager",
      department: "Product",
      appliedAt: "6d ago",
      stage: "interview",
    },
    {
      id: "c-omar",
      name: "Omar Bassett",
      initials: "OB",
      role: "Frontend Engineer",
      department: "Engineering",
      appliedAt: "1w ago",
      stage: "interview",
    },
    {
      id: "c-nadia",
      name: "Nadia Khan",
      initials: "NK",
      role: "Finance Lead",
      department: "Finance",
      appliedAt: "1w ago",
      stage: "offer",
    },
    {
      id: "c-elias",
      name: "Elias Roth",
      initials: "ER",
      role: "DevOps Engineer",
      department: "Engineering",
      appliedAt: "10d ago",
      stage: "offer",
    },
    {
      id: "c-sofia-h",
      name: "Sofia Alvarez",
      initials: "SA",
      role: "Product Designer",
      department: "Design",
      appliedAt: "12d ago",
      stage: "hired",
    },
    {
      id: "c-daniel-h",
      name: "Daniel Okafor",
      initials: "DO",
      role: "Backend Engineer",
      department: "Engineering",
      appliedAt: "13d ago",
      stage: "hired",
    },
  ],
  openings: [
    {
      id: "o-1",
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      applicants: 54,
      postedDaysAgo: 8,
    },
    {
      id: "o-2",
      title: "Account Executive",
      department: "Sales",
      location: "London, UK",
      applicants: 41,
      postedDaysAgo: 12,
    },
    {
      id: "o-3",
      title: "Product Manager",
      department: "Product",
      location: "Remote",
      applicants: 28,
      postedDaysAgo: 4,
    },
  ],
}
