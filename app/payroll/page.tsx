import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { PayRunSummary } from "@/components/payroll/pay-run-summary"
import { CostByDepartment } from "@/components/payroll/cost-by-department"
import { PayBreakdown } from "@/components/payroll/pay-breakdown"
import { EmployeePayments } from "@/components/payroll/employee-payments"

export default function PayrollPage() {
  return (
    <DashboardShell activeHref="/payroll" current="Payroll" accentCurrent>
      <PayrollHeader />
      <PayRunSummary />
      <div className="flex w-full items-start gap-5">
        <CostByDepartment />
        <PayBreakdown />
      </div>
      <EmployeePayments />
    </DashboardShell>
  )
}
