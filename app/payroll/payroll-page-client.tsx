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
import { exportToCsv } from "@/lib/export"
import { onAction, consumePendingAction } from "@/lib/command-actions"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { type PayrollStore, defaultPayrollStore, type Employee, formatMoney } from "@/lib/data"

export function PayrollPageClient() {
  const { user } = useAuth()
  const canWrite = user?.role === "admin"
  const { state, setState, hydrated } = useApiStore<PayrollStore>(
    "/api/store/payroll",
    () => defaultPayrollStore,
  )
  // The directory is the source of truth for who gets paid and how much.
  const { state: employees } = useApiStore<Employee[]>("/api/store/employees", () => [])

  const [runConfirmOpen, setRunConfirmOpen] = React.useState(false)

  // Employees eligible for this run: active directory members with a salary
  // who don't already have a payment row for this cycle.
  const eligible = employees.filter(
    (e) =>
      e.status !== "inactive" &&
      typeof e.salary === "number" &&
      e.salary > 0 &&
      !state.payments.some((p) => p.id === `pay-${e.id}`),
  )
  const missingSalary = employees.filter(
    (e) => e.status !== "inactive" && !(typeof e.salary === "number" && e.salary > 0),
  )
  const dueCount = state.payments.filter(
    (p) => p.status === "pending" || p.status === "failed",
  ).length

  const handleRunPayroll = () => {
    // 1) Generate pending payments for newly eligible employees (stable ids
    //    keyed on the employee id so re-runs update rather than duplicate).
    const generated = eligible.map((e) => ({
      id: `pay-${e.id}`,
      initials: e.initials,
      name: e.name,
      role: e.role,
      department: e.department,
      gross: e.salary ?? 0,
      deductions: 0,
      status: "pending" as const,
    }))
    // 2) Process: mark every pending/failed payment as paid.
    const processed = generated.length + dueCount
    setState((prev) => {
      const payments = [...prev.payments, ...generated].map((p) =>
        p.status === "pending" || p.status === "failed" ? { ...p, status: "paid" as const } : p,
      )
      return { payments, lastRun: new Date().toISOString() }
    })
    const skippedNote =
      missingSalary.length > 0
        ? ` Skipped ${missingSalary.length} employee(s) without a salary — add one on the Employees page.`
        : ""
    notify.success(
      "Payroll run complete",
      `${processed} payment(s) processed (${formatMoney(
        [...state.payments, ...generated]
          .filter((p) => p.status !== "paid")
          .reduce((s, p) => s + p.gross, 0),
      )} gross).${skippedNote}`,
    )

  }

  React.useEffect(() => {
    const off = onAction((id) => {
      if (id === "run-payroll" && canWrite) setRunConfirmOpen(true)
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (canWrite && consumePendingAction("run-payroll")) setRunConfirmOpen(true)
    return off
  }, [canWrite])

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/payroll" current="Payroll" accentCurrent>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-[140px] w-full rounded-2xl" />
        <div className="flex w-full items-start gap-5">
          <Skeleton className="h-[200px] flex-1 rounded-2xl" />
          <Skeleton className="h-[200px] flex-1 rounded-2xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/payroll" current="Payroll" accentCurrent>
      <PayrollHeader
        employeeCount={state.payments.length}
        onExport={() => {
          exportToCsv("payroll", state.payments, [
            { key: "name", label: "Name" },
            { key: "role", label: "Role" },
            { key: "department", label: "Department" },
            { key: "gross", label: "Gross" },
            { key: "deductions", label: "Deductions" },
            { key: "status", label: "Status" },
          ])
          notify.success("Payroll exported", `${state.payments.length} payments downloaded as CSV.`)
        }}
        onRunPayroll={canWrite ? () => setRunConfirmOpen(true) : undefined}
      />
      <PayRunSummary payments={state.payments} lastRun={state.lastRun} />
      <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-start">
        <CostByDepartment payments={state.payments} />
        <PayBreakdown payments={state.payments} />
      </div>
      <EmployeePayments
        payments={state.payments}
        onUpdateStatus={
          canWrite
            ? (id, status) => {
                const p = state.payments.find((x) => x.id === id)
                setState((prev) => ({
                  ...prev,
                  payments: prev.payments.map((x) => (x.id === id ? { ...x, status } : x)),
                }))
                notify.success(
                  status === "paid" ? "Payment marked as paid" : "Payment marked as failed",
                  p ? `${p.name}'s payment updated.` : undefined,
                )
              }
            : undefined
        }
      />
      <ConfirmDialog
        open={runConfirmOpen}
        onOpenChange={setRunConfirmOpen}
        title="Run payroll"
        description={
          state.payments.length === 0 && eligible.length === 0
            ? missingSalary.length > 0
              ? `No employee has a salary set yet. Add monthly salaries on the Employees page first (${missingSalary.length} active employee(s) missing one).`
              : "There are no active employees in the directory yet."
            : `Generate ${eligible.length} new payment(s) and process ${dueCount} pending. Employees are picked up from the directory with their monthly salary.${
                missingSalary.length > 0
                  ? ` ${missingSalary.length} active employee(s) have no salary and will be skipped.`
                  : ""
              }`
        }
        confirmLabel="Run payroll"
        destructive
        onConfirm={() => {
          setRunConfirmOpen(false)
          handleRunPayroll()
        }}
      />
    </DashboardShell>
  )
}
