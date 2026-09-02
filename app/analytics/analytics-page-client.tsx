"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AnalyticsHeader } from "@/components/analytics/analytics-header"
import { AnalyticsKpiStrip } from "@/components/analytics/analytics-kpi-strip"
import { WorkforceTrendCard } from "@/components/analytics/workforce-trend-card"
import { WorkforceBreakdown } from "@/components/analytics/workforce-breakdown"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { useApiStore } from "@/hooks/use-api-store"
import {
  type AnalyticsStore,
  defaultAnalyticsStore,
} from "@/lib/data"

export function AnalyticsPageClient() {
  const { state, hydrated } = useApiStore<AnalyticsStore>(
    "/api/store/analytics",
    () => defaultAnalyticsStore,
  )

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/analytics" current="Analytics" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-24 flex-1 rounded-2xl" />
          <Skeleton className="h-24 flex-1 rounded-2xl" />
          <Skeleton className="h-24 flex-1 rounded-2xl" />
          <Skeleton className="h-24 flex-1 rounded-2xl" />
        </div>
        <div className="mt-5 flex gap-5">
          <Skeleton className="h-[320px] flex-1 rounded-2xl" />
          <Skeleton className="h-[320px] w-[440px] rounded-2xl" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/analytics" current="Analytics" accentCurrent>
      <AnalyticsHeader
        onExport={() => {
          exportToCsv("analytics-workforce", state.byDept, [
            { key: "label", label: "Department" },
            { key: "count", label: "Headcount" },
            { key: "pct", label: "Share %" },
          ])
          notify.success("Analytics exported", "Workforce breakdown downloaded as CSV.")
        }}
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
          onOpenReport={() =>
            document.getElementById("analytics-breakdown")?.scrollIntoView({ behavior: "smooth" })
          }
        />
        <WorkforceBreakdown
          byDept={state.byDept}
          byTenure={state.byTenure}
        />
      </div>
    </DashboardShell>
  )
}
