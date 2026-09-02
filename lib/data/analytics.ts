export type MonthlyTrend = {
  month: string
  value: number
  current?: boolean
}

export type DeptBreakdown = {
  label: string
  pct: number
  count: number
  fill: string
}

export type TenureBreakdown = {
  label: string
  pct: number
  count: number
  fill: string
}

export type AnalyticsStore = {
  headcount: number
  headcountDelta: string
  attrition: string
  attritionDelta: string
  avgTenure: string
  avgTenureDelta: string
  offerAcceptRate: string
  offerAcceptRateDelta: string
  monthlyTrend: MonthlyTrend[]
  byDept: DeptBreakdown[]
  byTenure: TenureBreakdown[]
}

export const defaultAnalyticsStore: AnalyticsStore = {
  headcount: 0,
  headcountDelta: "",
  attrition: "",
  attritionDelta: "",
  avgTenure: "",
  avgTenureDelta: "",
  offerAcceptRate: "",
  offerAcceptRateDelta: "",
  monthlyTrend: [],
  byDept: [],
  byTenure: [],
}