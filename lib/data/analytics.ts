import type { ID } from "./types"

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
  headcount: 284,
  headcountDelta: "+12",
  attrition: "4.2%",
  attritionDelta: "-0.6",
  avgTenure: "3.1 yrs",
  avgTenureDelta: "+0.2",
  offerAcceptRate: "78%",
  offerAcceptRateDelta: "+5%",
  monthlyTrend: [
    { month: "Mar", value: 38 },
    { month: "Apr", value: 42 },
    { month: "May", value: 47 },
    { month: "Jun", value: 51 },
    { month: "Jul", value: 49 },
    { month: "Aug", value: 56 },
    { month: "Sep", value: 60 },
    { month: "Oct", value: 65 },
    { month: "Nov", value: 70 },
    { month: "Dec", value: 76 },
    { month: "Jan", value: 84 },
    { month: "Feb", value: 92, current: true },
  ],
  byDept: [
    { label: "Engineering", pct: 30, count: 284, fill: "bg-[#2f6f61]" },
    { label: "Sales", pct: 18, count: 142, fill: "bg-[#64b6ac]" },
    { label: "Product", pct: 14, count: 124, fill: "bg-[#3e9488]" },
    { label: "Design", pct: 9, count: 86, fill: "bg-[#3bb273]" },
    { label: "Marketing", pct: 8, count: 68, fill: "bg-[#f4a261]" },
    { label: "People", pct: 6, count: 42, fill: "bg-[#7ba88c]" },
  ],
  byTenure: [
    { label: "< 1 year", pct: 22, count: 63, fill: "bg-[#64b6ac]" },
    { label: "1–2 years", pct: 28, count: 80, fill: "bg-[#2f6f61]" },
    { label: "2–4 years", pct: 31, count: 88, fill: "bg-[#3bb273]" },
    { label: "4–7 years", pct: 13, count: 37, fill: "bg-[#f4a261]" },
    { label: "7+ years", pct: 6, count: 16, fill: "bg-[#e76f51]" },
  ],
}
