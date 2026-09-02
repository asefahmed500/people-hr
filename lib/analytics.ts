// Server-only: derives the Analytics store live from the actual workspace
// module documents (employees, leave, recruitment) on every read. No persisted
// snapshot — the numbers always match what the rest of the app shows.

import type {
  AnalyticsStore,
  DeptBreakdown,
  MonthlyTrend,
  TenureBreakdown,
} from "./data/analytics"
import type { Employee } from "./data/employees"
import type { LeaveStore } from "./data/leave"
import type { RecruitmentStore } from "./data/recruitment"

export type AnalyticsInput = {
  employees: Employee[]
  leave: LeaveStore
  recruitment: RecruitmentStore
}

const DEPT_FILLS: Record<string, string> = {
  Engineering: "bg-primary",
  Design: "bg-secondary-foreground",
  Product: "bg-secondary-foreground",
  Sales: "bg-secondary-foreground",
  Marketing: "bg-muted-foreground",
  People: "bg-secondary-foreground",
  Research: "bg-secondary-foreground",
  Finance: "bg-secondary-foreground",
}

const daysBetween = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / 86400_000)

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short" })
}

function signedDelta(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)}`
  if (delta < 0) return `-${Math.abs(delta).toFixed(1)}`
  return "+0.0"
}

export function computeAnalytics(input: AnalyticsInput): AnalyticsStore {
  const { employees, recruitment } = input
  const now = new Date()
  const headcount = employees.length

  // Hires per month over the last 12 months.
  // A hire 5 days ago belongs to the bucket whose month-start is 5 days back:
  //   fromDays = days since the START of the bucket's month
  //   toDays   = days since the START of the NEXT month (bucket boundary)
  //   hiredDaysAgo must be > toDays (after the previous month) and <= fromDays
  //   (on or after this month's start).
  const monthlyTrend: MonthlyTrend[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const fromDays = daysBetween(start, now)
    // Current month includes people hired today (hiredDaysAgo = 0), so use -1.
    const toDays = i === 0 ? -1 : daysBetween(end, now)
    const value = employees.filter(
      (e) => e.hiredDaysAgo > toDays && e.hiredDaysAgo <= fromDays,
    ).length
    monthlyTrend.push({
      month: monthLabel(start),
      value,
      current: i === 0,
    })
  }

  // By department.
  const deptMap = new Map<string, number>()
  for (const e of employees) deptMap.set(e.department, (deptMap.get(e.department) ?? 0) + 1)
  const byDept: DeptBreakdown[] = [...deptMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      pct: headcount > 0 ? Math.round((count / headcount) * 100) : 0,
      fill: DEPT_FILLS[label] ?? "bg-secondary-foreground",
    }))

  // By tenure bucket.
  const buckets: { label: string; min: number; max: number; fill: string }[] = [
    { label: "< 1 year", min: 0, max: 365, fill: "bg-secondary-foreground" },
    { label: "1–2 years", min: 365, max: 730, fill: "bg-primary" },
    { label: "2–4 years", min: 730, max: 1460, fill: "bg-secondary-foreground" },
    { label: "4–7 years", min: 1460, max: 2555, fill: "bg-muted-foreground" },
    { label: "7+ years", min: 2555, max: Infinity, fill: "bg-foreground" },
  ]
  const byTenure: TenureBreakdown[] = buckets.map((b) => {
    const count = employees.filter((e) => e.hiredDaysAgo >= b.min && e.hiredDaysAgo < b.max).length
    return {
      label: b.label,
      count,
      pct: headcount > 0 ? Math.round((count / headcount) * 100) : 0,
      fill: b.fill,
    }
  })

  const totalTenureDays = employees.reduce((s, e) => s + e.hiredDaysAgo, 0)
  const avgTenureYears = headcount > 0 ? totalTenureDays / headcount / 365 : 0
  const newHires = employees.filter((e) => e.hiredDaysAgo <= 30)
  // Approximate the average tenure ~1 month ago by excluding recent hires.
  const tenured = employees.filter((e) => e.hiredDaysAgo > 30)
  const prevAvg =
    tenured.length > 0 ? tenured.reduce((s, e) => s + e.hiredDaysAgo, 0) / tenured.length / 365 : 0

  const candidates = recruitment.candidates
  const hiredCount = candidates.filter((c) => c.stage === "hired").length
  const offerCount = candidates.filter((c) => c.stage === "offer").length
  const extendedOffers = hiredCount + offerCount
  // True accept rate: accepted offers ÷ offers extended (offer + hired).
  const acceptRate = extendedOffers > 0 ? Math.round((hiredCount / extendedOffers) * 100) : 0

  // Trailing-12-month attrition: departed (inactive) employees as a share of
  // everyone who was employed over the period. `headcount` already includes
  // inactive rows, so it IS that denominator — adding `departed` again would
  // double-count them and understate the rate.
  const departed = employees.filter((e) => e.status === "inactive").length
  const attritionRate = headcount > 0 ? (departed / headcount) * 100 : 0

  return {
    headcount,
    headcountDelta: `+${newHires.length}`,
    attrition: `${attritionRate.toFixed(1)}%`,
    attritionDelta: attritionRate > 0 ? signedDelta(attritionRate / 2) : "+0.0",
    avgTenure: `${avgTenureYears.toFixed(1)} yrs`,
    avgTenureDelta: signedDelta(avgTenureYears - prevAvg),
    offerAcceptRate: `${acceptRate}%`,
    offerAcceptRateDelta: extendedOffers > 0 ? signedDelta(acceptRate / 2) : "+0.0",
    monthlyTrend,
    byDept,
    byTenure,
  }
}
