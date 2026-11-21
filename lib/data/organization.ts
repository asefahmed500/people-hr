export type Dept = {
  id: string
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
  id?: string
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
  /** Real company name used on HR letters and the workspace panel. Admin-set. */
  companyName: string
  departments: Dept[]
  offices: Office[]
  orgChart: OrgNode[]
}

export const defaultOrganizationStore: OrganizationStore = {
  companyName: "",
  departments: [],
  offices: [],
  orgChart: [],
}