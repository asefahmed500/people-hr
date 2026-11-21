"use client"

import * as React from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PerformanceHeader } from "@/components/performance/performance-header"
import { RatingDistribution } from "@/components/performance/rating-distribution"
import { DepartmentFilterBar } from "@/components/performance/department-filter-bar"
import { PerformanceSpotlight } from "@/components/performance/performance-spotlight"
import { TeamLeaderboard } from "@/components/performance/team-leaderboard"
import { EmployeePerformance } from "@/components/performance/employee-performance"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { TextArea, SelectField, useForm } from "@/components/shared/field"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  type PerformanceStore,
  type Review,
  type ReviewStatus,
  defaultPerformanceStore,
  defaultEmployees,
  type Employee,
} from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"

export function PerformancePageClient() {
  const {
    state: store,
    setState,
    hydrated,
    error: performanceError,
    retry: retryPerformance,
  } = useApiStore<PerformanceStore>(
    "/api/store/performance",
    () => defaultPerformanceStore,
  )
  const { user } = useAuth()
  // Reviews are written by managers/admins about their people. Employees get
  // a read-only view (the server merge rejects employee review writes too).
  const canWrite = user?.role === "admin" || user?.role === "manager"
  const {
    state: employees,
    error: employeesError,
    retry: retryEmployees,
  } = useApiStore<Employee[]>("/api/store/employees", () => defaultEmployees)
  const error = performanceError || employeesError
  const retry = () => {
    retryPerformance()
    retryEmployees()
  }

  const [activeDept, setActiveDept] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Review | null>(null)

  // Keep every chart, the leaderboard and the header count consistent with the
  // selected department filter, not just the table.
  const visibleReviews = React.useMemo(
    () => activeDept === "all" ? store.reviews : store.reviews.filter((r) => r.department === activeDept),
    [store.reviews, activeDept],
  )
  const visibleScores = React.useMemo(
    () => activeDept === "all" ? store.teamScores : store.teamScores.filter((t) => t.team === activeDept),
    [store.teamScores, activeDept],
  )

  const employeeOptions = React.useMemo(() => {
    const seen = new Set<string>()
    const all: Array<{ value: string; label: string }> = []
    for (const r of store.reviews) {
      const key = r.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      all.push({
        value: r.name.toLowerCase().replace(/\s+/g, "-"),
        label: `${r.name} - ${r.role}`,
      })
    }
    for (const e of employees) {
      const key = e.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      all.push({
        value: e.name.toLowerCase().replace(/\s+/g, "-"),
        label: `${e.name} - ${e.role}`,
      })
    }
    return all
  }, [store.reviews, employees])

  const reviewForm = useForm({
    employee: "",
    rating: "3",
    comments: "",
    period: "",
  })

  // Review cycles: current year's quarters.
  const periodOptions = React.useMemo(() => {
    const y = new Date().getFullYear()
    return [
      { value: `Q1 ${y}`, label: `Q1 ${y}` },
      { value: `Q2 ${y}`, label: `Q2 ${y}` },
      { value: `Q3 ${y}`, label: `Q3 ${y}` },
      { value: `Q4 ${y}`, label: `Q4 ${y}` },
      { value: `H1 ${y}`, label: `H1 ${y} (mid-year)` },
      { value: `FY ${y}`, label: `FY ${y} (annual)` },
    ]
  }, [])

  function handleStartReview() {
    reviewForm.reset()
    setReviewOpen(true)
  }

  function handleSubmitReview() {
    const employeeKey = reviewForm.values.employee
    if (!employeeKey) {
      notify.error("Missing selection", "Please select an employee.")
      return
    }
    const existing = store.reviews.find(
      (r) => r.name.toLowerCase().replace(/\s+/g, "-") === employeeKey,
    )
    const emp = employees.find(
      (e) => e.name.toLowerCase().replace(/\s+/g, "-") === employeeKey,
    )
    if (!existing && !emp) {
      notify.error("Employee not found")
      return
    }
    const rating = Math.min(5, Math.max(1, parseFloat(reviewForm.values.rating) || 3))
    let status: ReviewStatus = "meets"
    if (rating >= 4.5) status = "exceeds"
    else if (rating >= 3.5) status = "meets"
    else if (rating >= 2.5) status = "below"
    else status = "needs"

    const reviewedAt = new Date().toISOString().split("T")[0]
    const source = existing ?? emp!
    const newReview: Review = {
      id: existing?.id ?? `r-${Math.random().toString(36).slice(2, 9)}`,
      initials: source.initials,
      avatarBg: existing?.avatarBg ?? "bg-foreground",
      name: source.name,
      role: source.role,
      deptDot: existing?.deptDot ?? "bg-foreground",
      department: source.department,
      reviewer: user?.name ?? "Reviewer",
      rating,
      status,
      comments: reviewForm.values.comments.trim() || undefined,
      reviewedAt,
      period: reviewForm.values.period || undefined,
    }
    setState((prev) =>
      existing
        ? {
            ...prev,
            reviews: prev.reviews.map((r) => (r.id === existing.id ? newReview : r)),
          }
        : { ...prev, reviews: [newReview, ...prev.reviews] },
    )
    notify.success(
      existing ? "Review submitted" : "Review created",
      `Updated ${source.name}'s review.`,
    )

    setReviewOpen(false)
  }

  if (error) {
    return (
      <DashboardShell activeHref="/performance" current="Performance" accentCurrent>
        <StoreErrorState onRetry={retry} />
      </DashboardShell>
    )
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/performance" current="Performance" accentCurrent>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="flex w-full gap-4">
          <Skeleton className="h-[180px] flex-1 rounded-lg" />
          <Skeleton className="h-[180px] w-full shrink-0 rounded-lg lg:w-[300px]" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/performance" current="Performance" accentCurrent>
      <PerformanceHeader
        onExport={() => {
          exportToCsv("performance-reviews", store.reviews, [
            { key: "name", label: "Name" },
            { key: "role", label: "Role" },
            { key: "department", label: "Department" },
            { key: "reviewer", label: "Reviewer" },
            { key: "rating", label: "Rating" },
            { key: "status", label: "Status" },
          ])
          notify.success("Performance exported", `${store.reviews.length} reviews downloaded as CSV.`)
        }}
        onStartReview={canWrite ? handleStartReview : undefined}
        subtitle={`${new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} Ã‚Â· ${visibleReviews.filter((r) => r.reviewedAt || r.status !== "needs").length} of ${visibleReviews.length} reviews submitted`}
      />
      <RatingDistribution reviews={visibleReviews} />
      <DepartmentFilterBar
        activeDept={activeDept}
        onDeptChange={setActiveDept}
        reviews={store.reviews}
      />
      <PerformanceSpotlight reviews={visibleReviews} teamScores={visibleScores} />
      <TeamLeaderboard
        teamScores={visibleScores}
        onFullReport={() =>
          document.getElementById("employee-performance")?.scrollIntoView({ behavior: "smooth" })
        }
      />
      <EmployeePerformance
        filterDept={activeDept}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        reviews={visibleReviews}
        onDelete={canWrite ? setDeleteTarget : undefined}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Delete review"
        description={deleteTarget ? `Delete the review for ${deleteTarget.name}? This canÃ¢â‚¬â„¢t be undone.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            setState((prev) => ({
              ...prev,
              reviews: prev.reviews.filter((r) => r.id !== deleteTarget.id),
            }))
            notify.success("Review deleted", `${deleteTarget.name}'s review was removed.`)
          }
          setDeleteTarget(null)
        }}
      />
      <ActionDialog width="wide"
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title="Start review"
        description="Select an employee and provide your assessment"
        submitLabel="Submit review"
        onSubmit={handleSubmitReview}
      >
        <SelectField
          label="Employee"
          value={reviewForm.values.employee}
          onChange={(v) => reviewForm.setValue("employee", v)}
          options={employeeOptions}
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Rating"
            value={reviewForm.values.rating}
            onChange={(v) => reviewForm.setValue("rating", v)}
            options={[
              { value: "5", label: "5 Ã‚Â· Outstanding" },
              { value: "4.5", label: "4.5 Ã‚Â· Exceeds" },
              { value: "4", label: "4 Ã‚Â· Strong" },
              { value: "3.5", label: "3.5 Ã‚Â· Meets+" },
              { value: "3", label: "3 Ã‚Â· Meets" },
              { value: "2.5", label: "2.5 Ã‚Â· Below+" },
              { value: "2", label: "2 Ã‚Â· Below" },
              { value: "1", label: "1 Ã‚Â· Needs improvement" },
            ]}
            required
          />
          <SelectField
            label="Review period"
            value={reviewForm.values.period}
            onChange={(v) => reviewForm.setValue("period", v)}
            options={periodOptions}
          />
        </div>
        <TextArea
          label="Comments"
          value={reviewForm.values.comments}
          onChange={(v) => reviewForm.setValue("comments", v)}
          placeholder="Add your review comments..."
          error={reviewForm.errors.comments}
        />
      </ActionDialog>
    </DashboardShell>
  )
}
