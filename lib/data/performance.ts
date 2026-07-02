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
}

export const reviewStatusStyles: Record<
  ReviewStatus,
  { bg: string; text: string; label: string }
> = {
  exceeds: { bg: "bg-[#6d5ce71a]", text: "text-[#6d5ce7]", label: "Exceeds" },
  meets: { bg: "bg-[#a29bfe22]", text: "text-[#5f3dc4]", label: "Meets" },
  below: { bg: "bg-[#f4a26122]", text: "text-[#b26a1f]", label: "Below" },
  needs: {
    bg: "bg-[#e76f5120]",
    text: "text-[#c4553a]",
    label: "Needs improvement",
  },
}

export const defaultReviews: Review[] = [
  { id: "r-pn", initials: "PN", avatarBg: "bg-[#845ef7]", name: "Priya Nair", role: "Senior Engineer", deptDot: "bg-[#845ef7]", department: "Engineering", reviewer: "Asef Ahmed", rating: 4.6, status: "exceeds" },
  { id: "r-mb", initials: "MB", avatarBg: "bg-[#6d5ce7]", name: "Marcus Bell", role: "Product Designer", deptDot: "bg-[#6d5ce7]", department: "Design", reviewer: "Lena Chen", rating: 4.4, status: "exceeds" },
  { id: "r-so", initials: "SO", avatarBg: "bg-[#b197fc]", name: "Sara Okoye", role: "Product Manager", deptDot: "bg-[#b197fc]", department: "Product", reviewer: "Jamie Ford", rating: 4.1, status: "meets" },
  { id: "r-tf", initials: "TF", avatarBg: "bg-[#845ef7]", name: "Tom Fischer", role: "Backend Engineer", deptDot: "bg-[#845ef7]", department: "Engineering", reviewer: "Asef Ahmed", rating: 3.9, status: "meets" },
  { id: "r-lv", initials: "LV", avatarBg: "bg-[#f4a261]", name: "Lena Voss", role: "Growth Marketer", deptDot: "bg-[#f4a261]", department: "Marketing", reviewer: "Rosa Diaz", rating: 3.6, status: "below" },
  { id: "r-op", initials: "OP", avatarBg: "bg-[#e76f51]", name: "Owen Park", role: "Account Executive", deptDot: "bg-[#e76f51]", department: "Sales", reviewer: "Mateo Ruiz", rating: 3.1, status: "needs" },
  { id: "r-ak", initials: "AK", avatarBg: "bg-[#5f3dc4]", name: "Aisha Khan", role: "People Partner", deptDot: "bg-[#5f3dc4]", department: "People", reviewer: "Sana Malik", rating: 4.3, status: "exceeds" },
]

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

export const defaultTeamRows: TeamRow[] = [
  { rank: 1, dot: "bg-[#5f3dc4]", team: "People", reviewed: "16 reviewed", fillPct: 98, fill: "bg-[#6d5ce7]", rating: "4.5", rankBg: "bg-[#6d5ce71a]", rankText: "text-[#6d5ce7]" },
  { rank: 2, dot: "bg-[#6d5ce7]", team: "Design", reviewed: "18 reviewed", fillPct: 89, fill: "bg-[#6d5ce7]", rating: "4.4", rankBg: "bg-[#6d5ce715]", rankText: "text-[#6d5ce7]" },
  { rank: 3, dot: "bg-[#845ef7]", team: "Engineering", reviewed: "52 reviewed", fillPct: 96, fill: "bg-[#6d5ce7]", rating: "4.3", rankBg: "bg-[#6d5ce715]", rankText: "text-[#6d5ce7]" },
  { rank: 4, dot: "bg-[#b197fc]", team: "Product", reviewed: "22 reviewed", fillPct: 94, fill: "bg-[#6d5ce7]", rating: "4.2", rankBg: "bg-[#6d5ce715]", rankText: "text-[#6d5ce7]" },
  { rank: 5, dot: "bg-[#f4a261]", team: "Marketing", reviewed: "24 reviewed", fillPct: 95, fill: "bg-[#2e9160]", rating: "4.1", rankBg: "bg-[#2f6f6115]", rankText: "text-[#2f6f61]" },
  { rank: 6, dot: "bg-[#e76f51]", team: "Sales", reviewed: "46 reviewed", fillPct: 92, fill: "bg-[#2e9160]", rating: "3.9", rankBg: "bg-[#2f6f6115]", rankText: "text-[#2f6f61]" },
]

export type PerformanceStore = {
  reviews: Review[]
  teamScores: TeamRow[]
}

export const defaultPerformanceStore: PerformanceStore = {
  reviews: defaultReviews,
  teamScores: defaultTeamRows,
}
