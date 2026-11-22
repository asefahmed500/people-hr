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
import { StoreErrorState } from "@/components/shared/store-error-state"
import {
  type PayrollStore,
  defaultPayrollStore,
  type Employee,
  formatMoney,
  planPayrollRun,
  currentPeriod,
  type Payment,
} from "@/lib/data"
import { apiRequest } from "@/lib/api-client"

export function PayrollPageClient() {
  const { user } = useAuth()
  const canWrite = user?.role === "admin"
  const { state, setState, hydrated, error: payrollError, retry: retryPayroll } = useApiStore<PayrollStore>(
    "/api/store/payroll",
    () => defaultPayrollStore,
  )
  // The directory is the source of truth for who gets paid and how much.
  const {
    state: employees,
    error: employeesError,
    retry: retryEmployees,
  } = useApiStore<Employee[]>("/api/store/employees", () => [])
  const error = payrollError || employeesError
  const retry = () => {
    retryPayroll()
    retryEmployees()
  }

  const [runConfirmOpen, setRunConfirmOpen] = React.useState(false)
  const [runSubmitting, setRunSubmitting] = React.useState(false)

  // A run is a period-based business operation: snapshot each eligible
  // employee's salary into a payment row, then record it. The pure planner is
  // shared with the unit tests so the rules don't drift from the UI.
  const period = currentPeriod()
  const preview = React.useMemo(
    () => planPayrollRun(state.payments, employees, period),
    [state.payments, employees, period],
  )
  const eligible = preview.generated
  const missingSalary = preview.skipped
  const dueCount = state.payments.filter(
    (p) => p.status === "pending" || p.status === "failed",
  ).length

  const handleRunPayroll = async () => {
    setRunSubmitting(true)
    const beforeIds = new Set(state.payments.map((p) => p.id))
    try {
      const result = await apiRequest<{
        processed: number
        skipped: string[]
        payments: Payment[]
        lastRun: string
      }>("/api/payroll/run", { method: "POST", body: { period } })
      // The POST already advanced the document version under CAS. Do NOT write
      // the old local state back — that would send a stale If-Match and show a
      // false "out of date" toast. Refetch the authoritative document instead.
      retryPayroll()
      const newlyRecorded = result.payments.filter((p) => !beforeIds.has(p.id))
      const currency = newlyRecorded[0]?.currency ?? "USD"
      const gross = newlyRecorded.reduce((s, p) => s + p.gross, 0)
      const skippedNote =
        result.skipped.length > 0
          ? ` Skipped ${result.skipped.length} employee(s) without a salary - add one on the Employees page.`
          : ""
      notify.success(
        "Payroll recorded",
        `${result.processed} payment(s) for ${period} (${formatMoney(gross, currency)} gross). No money was sent.${skippedNote}`,
      )
    } catch (error) {
      notify.error(
        "Could not record payroll",
        error instanceof Error ? error.message : "Please try again.",
      )
    } finally {
      setRunSubmitting(false)
      setRunConfirmOpen(false)
    }
  }

  React.useEffect(() => {
    const off = onAction((id) => {
      if (id === "run-payroll" && canWrite) setRunConfirmOpen(true)
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (canWrite && consumePendingAction("run-payroll")) setRunConfirmOpen(true)
    return off
  }, [canWrite])

  if (error) {
    return (
      <DashboardShell activeHref="/payroll" current="Payroll" accentCurrent>
        <StoreErrorState onRetry={retry} />
      </DashboardShell>
    )
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/payroll" current="Payroll" accentCurrent>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-[140px] w-full rounded-lg" />
        <div className="flex w-full items-start gap-4">
          <Skeleton className="h-[200px] flex-1 rounded-lg" />
          <Skeleton className="h-[200px] flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/payroll" current="Payroll" accentCurrent>
      <PayrollHeader
        employeeCount={state.payments.length}
        onExport={() => {
          exportToCsv("payroll", state.payments, [
            { key: "employeeId", label: "Employee ID" },
            { key: "period", label: "Period" },
            { key: "name", label: "Name" },
            { key: "role", label: "Role" },
            { key: "department", label: "Department" },
            { key: "currency", label: "Currency" },
            { key: "gross", label: "Gross" },
            { key: "deductions", label: "Deductions" },
            { key: "status", label: "Status" },
            { key: "paymentReference", label: "Payment reference" },
            { key: "recordedAt", label: "Recorded at" },
          ])
          notify.success("Payroll exported", `${state.payments.length} payments downloaded as CSV.`)
        }}
        onRunPayroll={canWrite ? () => setRunConfirmOpen(true) : undefined}
      />
      <PayRunSummary payments={state.payments} lastRun={state.lastRun} />
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
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
            : `Record ${eligible.length} new payment(s) for ${period} and close ${dueCount} pending. Salaries are snapshotted from the directory. This records data only - no money is sent, and no Stripe payout is created.${
                missingSalary.length > 0
                  ? ` ${missingSalary.length} active employee(s) have no salary and will be skipped.`
                  : ""
              }`
        }
        confirmLabel="Run payroll"
        submittingLabel="Recording…"
        submitting={runSubmitting}
        destructive
        onConfirm={handleRunPayroll}
      />
    </DashboardShell>
  )
}
