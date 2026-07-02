"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AnalyticsHeader } from "@/components/analytics/analytics-header"
import { AnalyticsKpiStrip } from "@/components/analytics/analytics-kpi-strip"
import { WorkforceTrendCard } from "@/components/analytics/workforce-trend-card"
import { WorkforceBreakdown } from "@/components/analytics/workforce-breakdown"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { useMockStore } from "@/hooks/use-mock-store"
import {
  STORAGE_KEYS,
  type AnalyticsStore,
  defaultAnalyticsStore,
} from "@/lib/data"

export function AnalyticsPageClient() {
  const { state, hydrated } = useMockStore<AnalyticsStore>(
    STORAGE_KEYS.analytics,
    () => defaultAnalyticsStore,
  )

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/analytics" current="Analytics" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-24 flex-1 rounded-[14px]" />
          <Skeleton className="h-24 flex-1 rounded-[14px]" />
          <Skeleton className="h-24 flex-1 rounded-[14px]" />
          <Skeleton className="h-24 flex-1 rounded-[14px]" />
        </div>
        <div className="mt-5 flex gap-5">
          <Skeleton className="h-[320px] flex-1 rounded-[18px]" />
          <Skeleton className="h-[320px] w-[440px] rounded-[18px]" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/analytics" current="Analytics" accentCurrent>
      <AnalyticsHeader
        onPeriodChange={() => notify.info("Period changed to Last 30 days")}
        onExport={() => notify.success("Analytics exported")}
      />
      <AnalyticsKpiStrip
        headcount={state.headcount}
        headcountDelta={state.headcountDelta}
        attrition={state.attrition}
        attritionDelta={state.attritionDelta}
        avgTenure={state.avgTenure}
        avgTenureDelta={state.avgTenureDelta}
        offerAcceptRate={state.offerAcceptRate}
        offerAcceptRateDelta={state.offerAcceptRateDelta}
      />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <WorkforceTrendCard
          monthlyTrend={state.monthlyTrend}
          onOpenReport={() => notify.info("Opening full workforce report")}
        />
        <WorkforceBreakdown
          byDept={state.byDept}
          byTenure={state.byTenure}
        />
      </div>
    </DashboardShell>
  )
}
