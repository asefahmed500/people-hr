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

/**
 * Resolve an absolute hire date. New records carry `hiredAt`; older documents
 * only have the relative `hiredDaysAgo`, which is pinned to the day it was
 * written. Using that legacy value directly would make tenure and every hiring
 * trend permanently frozen at their import-time values.
 */
function hireDate(e: Employee, now: Date): Date {
  if (e.hiredAt) {
    const parsed = new Date(`${e.hiredAt}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date(now.getTime() - e.hiredDaysAgo * 86_400_000)
}

export function computeAnalytics(input: AnalyticsInput): AnalyticsStore {
  const { employees, recruitment } = input
  const now = new Date()

  // Headline headcount must agree with the Organization page, which excludes
  // departed (inactive) records. Keep the full list only as an attrition
  // denominator.
  const active = employees.filter((e) => e.status !== "inactive")
  const headcount = active.length

  const hiredIn = (e: Employee) => hireDate(e, now)
  const monthOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`

  // Hires per calendar month over the last 12 months, bucketed by absolute
  // hire date so future months no longer show a permanent zero.
  const monthlyTrend: MonthlyTrend[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = active.filter((e) => monthOf(hiredIn(e)) === monthOf(start)).length
    monthlyTrend.push({ month: monthLabel(start), value, current: i === 0 })
  }

  const deptMap = new Map<string, number>()
  for (const e of active) deptMap.set(e.department, (deptMap.get(e.department) ?? 0) + 1)
  const byDept: DeptBreakdown[] = [...deptMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      pct: headcount > 0 ? Math.round((count / headcount) * 100) : 0,
      fill: DEPT_FILLS[label] ?? "bg-secondary-foreground",
    }))

  const tenureDays = (e: Employee) => Math.max(0, daysBetween(hireDate(e, now), now))
  const buckets: { label: string; min: number; max: number; fill: string }[] = [
    { label: "< 1 year", min: 0, max: 365, fill: "bg-secondary-foreground" },
    { label: "1–2 years", min: 365, max: 730, fill: "bg-primary" },
    { label: "2–4 years", min: 730, max: 1460, fill: "bg-secondary-foreground" },
    { label: "4–7 years", min: 1460, max: 2555, fill: "bg-muted-foreground" },
    { label: "7+ years", min: 2555, max: Infinity, fill: "bg-foreground" },
  ]
  const byTenure: TenureBreakdown[] = buckets.map((b) => {
    const count = active.filter((e) => tenureDays(e) >= b.min && tenureDays(e) < b.max).length
    return {
      label: b.label,
      count,
      pct: headcount > 0 ? Math.round((count / headcount) * 100) : 0,
      fill: b.fill,
    }
  })

  const avgTenureYears = headcount > 0
    ? active.reduce((s, e) => s + tenureDays(e), 0) / headcount / 365
    : 0

  const candidates = recruitment.candidates
  const hiredCount = candidates.filter((c) => c.stage === "hired").length
  const offerCount = candidates.filter((c) => c.stage === "offer").length
  const extendedOffers = hiredCount + offerCount
  const acceptRate = extendedOffers > 0 ? Math.round((hiredCount / extendedOffers) * 100) : 0

  const departed = employees.length - headcount
  const attritionRate = employees.length > 0 ? (departed / employees.length) * 100 : 0
  const hiresThisMonth = active.filter((e) => monthOf(hireDate(e, now)) === monthOf(now)).length

  return {
    headcount,
    // A real, derivable figure: hires whose absolute hire date is this month.
    headcountDelta: hiresThisMonth > 0 ? `+${hiresThisMonth}` : "",
    attrition: `${attritionRate.toFixed(1)}%`,
    // No prior-period snapshot exists. Report no delta rather than inventing
    // one as a fraction of the current value.
    attritionDelta: "",
    avgTenure: `${avgTenureYears.toFixed(1)} yrs`,
    avgTenureDelta: "",
    offerAcceptRate: `${acceptRate}%`,
    offerAcceptRateDelta: "",
    monthlyTrend,
    byDept,
    byTenure,
  }
}
