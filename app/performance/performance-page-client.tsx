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
import { Field, TextArea, SelectField, useForm } from "@/components/shared/field"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { STORAGE_KEYS, defaultNotificationsStore, newNotification, type PerformanceStore, type Review, type ReviewStatus, defaultPerformanceStore, type NotificationsStore, type Notification } from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"

export function PerformancePageClient() {
  const { state: store, setState, hydrated } = useMockStore<PerformanceStore>(
    STORAGE_KEYS.performance,
    () => defaultPerformanceStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }

  const [activeDept, setActiveDept] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [reviewOpen, setReviewOpen] = React.useState(false)

  const employeeOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return store.reviews
      .filter((r) => {
        const key = r.name.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((r) => ({
        value: r.name.toLowerCase().replace(/\s+/g, "-"),
        label: `${r.name} - ${r.role}`,
      }))
  }, [store.reviews])

  const reviewForm = useForm({
    employee: "",
    rating: "3",
    comments: "",
  })

  function handleStartReview() {
    reviewForm.reset()
    setReviewOpen(true)
  }

  function handleSubmitReview() {
    const employeeKey = reviewForm.values.employee
    if (!employeeKey) {
      notify.error("Please select an employee")
      return
    }
    const existing = store.reviews.find(
      (r) => r.name.toLowerCase().replace(/\s+/g, "-") === employeeKey,
    )
    if (!existing) {
      notify.error("Employee not found")
      return
    }
    const rating = parseFloat(reviewForm.values.rating)
    let status: ReviewStatus = "meets"
    if (rating >= 4.5) status = "exceeds"
    else if (rating >= 4) status = "meets"
    else if (rating >= 3) status = "below"
    else status = "needs"

    const newReview: Review = {
      id: `r-${Date.now()}`,
      initials: existing.initials,
      avatarBg: existing.avatarBg,
      name: existing.name,
      role: existing.role,
      deptDot: existing.deptDot,
      department: existing.department,
      reviewer: "You",
      rating,
      status,
    }
    setState((prev) => ({
      ...prev,
      reviews: [...prev.reviews, newReview],
    }))
    notify.success("Review submitted")
    addNotification({ type: "review_started", title: "Review started", description: `Review for ${existing.name} has been started`, href: "/performance" })
    setReviewOpen(false)
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/performance" current="Performance" accentCurrent>
        <Skeleton className="h-12 w-full rounded-[14px]" />
        <Skeleton className="h-10 w-full rounded-[14px]" />
        <div className="flex w-full gap-5">
          <Skeleton className="h-[180px] flex-1 rounded-[18px]" />
          <Skeleton className="h-[180px] w-[300px] shrink-0 rounded-[18px]" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-[18px]" />
        <Skeleton className="h-[400px] w-full rounded-[18px]" />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/performance" current="Performance" accentCurrent>
      <PerformanceHeader
        onPeriodChange={() => notify.info("Period changed")}
        onExport={() => notify.success("Performance report exported")}
        onStartReview={handleStartReview}
      />
      <RatingDistribution reviews={store.reviews} />
      <DepartmentFilterBar
        activeDept={activeDept}
        onDeptChange={setActiveDept}
        reviews={store.reviews}
      />
      <PerformanceSpotlight reviews={store.reviews} />
      <TeamLeaderboard
        teamScores={store.teamScores}
        onFullReport={() => notify.info("Opening full report")}
      />
      <EmployeePerformance
        filterDept={activeDept}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onViewAll={() => notify.info("View all employees")}
        reviews={store.reviews}
      />
      <ActionDialog
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
        <Field
          label="Rating (1-5)"
          type="number"
          value={reviewForm.values.rating}
          onChange={(v) => reviewForm.setValue("rating", v)}
          required
        />
        <TextArea
          label="Comments"
          value={reviewForm.values.comments}
          onChange={(v) => reviewForm.setValue("comments", v)}
          placeholder="Add your review comments..."
        />
      </ActionDialog>
    </DashboardShell>
  )
}
