"use client"

import * as React from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { PayRunSummary } from "@/components/payroll/pay-run-summary"
import { CostByDepartment } from "@/components/payroll/cost-by-department"
import { PayBreakdown } from "@/components/payroll/pay-breakdown"
import { EmployeePayments } from "@/components/payroll/employee-payments"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { useMockStore } from "@/hooks/use-mock-store"
import { type PayrollStore, STORAGE_KEYS, defaultPayrollStore, defaultNotificationsStore, newNotification, type Payment, type NotificationsStore, type Notification } from "@/lib/data"

export function PayrollPageClient() {
  const { state, setState, hydrated } = useMockStore<PayrollStore>(
    STORAGE_KEYS.payroll,
    () => defaultPayrollStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }

  const handleRunPayroll = () => {
    const pendingCount = state.payments.filter((p) => p.status === "pending").length
    if (pendingCount === 0) {
      notify.info("No pending payments to process")
      return
    }
    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.status === "pending" ? { ...p, status: "paid" as const } : p,
      ),
      lastRun: new Date().toISOString(),
    }))
    notify.success("Payroll run complete", `${pendingCount} payment(s) processed`)
    addNotification({ type: "payroll_ran", title: "Payroll processed", description: "Payroll has been processed for all employees", href: "/payroll" })
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/payroll" current="Payroll" accentCurrent>
        <Skeleton className="h-12 w-full rounded-[14px]" />
        <Skeleton className="h-[140px] w-full rounded-[18px]" />
        <div className="flex w-full items-start gap-5">
          <Skeleton className="h-[200px] flex-1 rounded-[18px]" />
          <Skeleton className="h-[200px] flex-1 rounded-[18px]" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-[18px]" />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/payroll" current="Payroll" accentCurrent>
      <PayrollHeader
        onExport={() => notify.success("Report exported")}
        onRunPayroll={handleRunPayroll}
      />
      <PayRunSummary payments={state.payments} />
      <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-start">
        <CostByDepartment payments={state.payments} />
        <PayBreakdown payments={state.payments} />
      </div>
      <EmployeePayments
        payments={state.payments}
        onViewAll={() => notify.info("View all payments")}
      />
    </DashboardShell>
  )
}
