import type { Department } from "./types"

export type Dept = {
  code: string
  name: string
  sub: string
  people: number
  teams: number
  open: number
  leadInit: string
  leadName: string
  leadRole: string
  iconBg: string
  iconText: string
}

export type Office = {
  city: string
  country: string
  count: number
  fillPct: number
  fill: string
}

export type OrgNode = {
  initials: string
  name: string
  role: string
  isCeo?: boolean
}

export type OrganizationStore = {
  departments: Dept[]
  offices: Office[]
  orgChart: OrgNode[]
}

const defaultOrgChart: OrgNode[] = [
  { initials: "AC", name: "Amelia Chen", role: "Chief Executive Officer", isCeo: true },
  { initials: "RP", name: "Raj Patel", role: "Chief Technology Officer" },
  { initials: "HL", name: "Hana Lindqvist", role: "Chief Product Officer" },
  { initials: "MB", name: "Marcus Bailey", role: "Chief Revenue Officer" },
  { initials: "NK", name: "Nadia Khan", role: "Chief Financial Officer" },
  { initials: "DO", name: "Daniel Okafor", role: "VP Engineering" },
  { initials: "SA", name: "Sofia Alvarez", role: "Head of Design" },
  { initials: "TV", name: "Tomas Vidal", role: "VP Marketing" },
]

export const defaultOrganizationStore: OrganizationStore = {
  departments: [
    { code: "EN", name: "Engineering", sub: "Product & Platform", people: 284, teams: 6, open: 4, leadInit: "DO", leadName: "Daniel Okafor", leadRole: "VP Engineering", iconBg: "bg-[#64b6ac29]", iconText: "text-[#3e9488]" },
    { code: "DE", name: "Design", sub: "Brand & Product", people: 86, teams: 4, open: 2, leadInit: "SA", leadName: "Sofia Alvarez", leadRole: "Head of Design", iconBg: "bg-[#f4a2612e]", iconText: "text-[#b96a2c]" },
    { code: "PR", name: "Product", sub: "Strategy & Ops", people: 124, teams: 5, open: 3, leadInit: "HL", leadName: "Hana Lindqvist", leadRole: "VP Product", iconBg: "bg-[#2f6f611a]", iconText: "text-[#2f6f61]" },
    { code: "SA", name: "Sales", sub: "Revenue & GTM", people: 142, teams: 5, open: 8, leadInit: "MB", leadName: "Marcus Bailey", leadRole: "VP Sales", iconBg: "bg-[#3bb27326]", iconText: "text-[#2e9160]" },
    { code: "MK", name: "Marketing", sub: "Brand & Growth", people: 68, teams: 3, open: 1, leadInit: "TV", leadName: "Tomas Vidal", leadRole: "VP Marketing", iconBg: "bg-[#e76f5124]", iconText: "text-[#cc5b3f]" },
    { code: "PE", name: "People", sub: "Talent & Culture", people: 42, teams: 2, open: 1, leadInit: "LF", leadName: "Lena Fischer", leadRole: "Director of People", iconBg: "bg-[#7ba88c29]", iconText: "text-[#548468]" },
    { code: "RE", name: "Research", sub: "Insights & Data", people: 38, teams: 2, open: 1, leadInit: "AC", leadName: "Amara Cole", leadRole: "Head of Research", iconBg: "bg-[#64b6ac29]", iconText: "text-[#3e9488]" },
    { code: "FI", name: "Finance", sub: "Accounting & FP&A", people: 56, teams: 2, open: 0, leadInit: "NK", leadName: "Nadia Khan", leadRole: "CFO", iconBg: "bg-[#2f6f611a]", iconText: "text-[#2f6f61]" },
  ],
  offices: [
    { city: "San Francisco", country: "United States · HQ", count: 342, fillPct: 100, fill: "bg-[#2f6f61]" },
    { city: "Remote", country: "Distributed · 32 countries", count: 296, fillPct: 86, fill: "bg-[#3e9488]" },
    { city: "London", country: "United Kingdom", count: 218, fillPct: 64, fill: "bg-[#2f6f61]" },
    { city: "Berlin", country: "Germany", count: 176, fillPct: 51, fill: "bg-[#64b6ac]" },
    { city: "Bangalore", country: "India", count: 154, fillPct: 45, fill: "bg-[#3e9488]" },
    { city: "Toronto", country: "Canada", count: 98, fillPct: 29, fill: "bg-[#b96a2c]" },
  ],
  orgChart: defaultOrgChart,
}
