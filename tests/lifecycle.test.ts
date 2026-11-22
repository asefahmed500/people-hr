import assert from "node:assert/strict"
import { test } from "node:test"

import {
  buildOnboardingChecklist,
  onboardingProgress,
} from "../lib/data/onboarding"
import {
  buildPayment,
  findPayment,
  formatMoney,
  paymentId,
  planPayrollRun,
  type Payment,
} from "../lib/data/payroll"
import { buildPayslip, formatPayslipMoney, grossPay, netPay, totalDeductions } from "../lib/data/payslips"
import { formatSalary, newEmployee, type Employee } from "../lib/data/employees"
import { STORE_SCHEMAS } from "../lib/store-schemas"
import { mergeNonAdminWrite } from "../lib/non-admin-merge"

const employee = (overrides: Partial<Employee> = {}): Employee =>
  newEmployee({
    name: "Riley Chen",
    email: "riley@example.com",
    department: "Engineering",
    role: "Engineer",
    location: "Remote",
    status: "active",
    salary: 5200,
    ...overrides,
  })

test("hiring generates a stable, employee-keyed onboarding checklist", () => {
  const e = employee()
  const tasks = buildOnboardingChecklist(e, new Date("2026-11-22T00:00:00Z"))
  assert.equal(tasks.length, 8)
  assert.ok(tasks.every((t) => t.employeeId === e.id))
  assert.equal(new Set(tasks.map((t) => t.id)).size, tasks.length)
  assert.ok(tasks.every((t) => !t.done && !!t.dueAt))
  assert.ok(tasks.some((t) => t.phase === "pre"))
  assert.ok(tasks.some((t) => t.phase === "ramped"))

  const progress = onboardingProgress(tasks, e.id)
  assert.equal(progress.total, 8)
  assert.equal(progress.done, 0)
  assert.equal(progress.pct, 0)

  const done = tasks.map((t, i) => (i < 2 ? { ...t, done: true } : t))
  assert.equal(onboardingProgress(done, e.id).done, 2)
  assert.equal(onboardingProgress(done).done, 2)
})

test("payroll snapshots salary into a period-keyed row and builds history", () => {
  const e = employee({ salaryCurrency: "EUR", stripeCustomerRef: "cus_123" })
  const period = "2026-11"
  const first = planPayrollRun([], [e], period, "2026-11-30T10:00:00Z")
  assert.equal(first.generated.length, 1)
  assert.equal(first.processed, 1)
  const p = first.payments[0]
  assert.equal(p.id, paymentId(e.id, period))
  assert.equal(p.employeeId, e.id)
  assert.equal(p.period, period)
  assert.equal(p.currency, "EUR")
  assert.equal(p.status, "paid")
  assert.equal(p.gross, 5200)
  assert.equal(p.paymentReference, "cus_123")

  // Re-running the same period does not duplicate; a new period does.
  const again = planPayrollRun(first.payments, [e], period)
  assert.equal(again.generated.length, 0)
  assert.equal(again.payments.length, 1)
  const next = planPayrollRun(first.payments, [e], "2026-12")
  assert.equal(next.generated.length, 1)
  assert.equal(next.payments.length, 2)
})

test("payroll skips salary-less and inactive employees", () => {
  const noSalary = employee({ salary: undefined, email: "none@example.com" })
  const inactive = employee({ status: "inactive", email: "off@example.com" })
  const result = planPayrollRun([], [employee(), noSalary, inactive], "2026-11")
  assert.equal(result.generated.length, 1)
  assert.equal(result.skipped.length, 1)
  assert.equal(result.skipped[0].email, "none@example.com")
})

test("legacy payment rows are not blocked by the new period key", () => {
  const e = employee()
  const legacy: Payment = {
    id: `pay-${e.id}`,
    initials: e.initials,
    name: e.name,
    role: e.role,
    department: e.department,
    gross: 4000,
    deductions: 0,
    status: "paid",
  }
  assert.equal(findPayment([legacy], e.id, "2026-11"), undefined)
  const result = planPayrollRun([legacy], [e], "2026-11")
  assert.equal(result.generated.length, 1)
  assert.equal(result.payments.length, 2)
})

test("payslips inherit currency and reconcile with payroll", () => {
  const e = employee({ salaryCurrency: "GBP" })
  const payment = buildPayment(e, "2026-11")
  const slip = buildPayslip(e, payment, "2026-11")
  assert.equal(slip.currency, "GBP")
  assert.equal(slip.status, "draft")
  assert.equal(grossPay(slip.earnings), payment.gross)
  assert.equal(totalDeductions(slip.deductions), payment.deductions)
  assert.equal(netPay(slip), payment.gross - payment.deductions)
  assert.match(formatPayslipMoney(1200, "GBP"), /£/)
})

test("compensation fields survive the zod schema and format in their currency", () => {
  const e = employee({ salaryCurrency: "PKR", payFrequency: "biweekly", salaryEffectiveDate: "2026-11-01" })
  const parsed = STORE_SCHEMAS.employees.safeParse([e])
  assert.equal(parsed.success, true)
  if (parsed.success) {
    const rows = parsed.data as Employee[]
    assert.equal(rows[0].salaryCurrency, "PKR")
    assert.equal(rows[0].payFrequency, "biweekly")
    assert.equal(rows[0].salaryEffectiveDate, "2026-11-01")
  }
  assert.match(formatSalary(5200, "PKR"), /₨|PKR/)
  assert.match(formatMoney(5200, "USD"), /\$/)
})

test("employees cannot raise their own salary or change stripe refs", () => {
  const stored = [employee()]
  const tampered = [{ ...stored[0], salary: 999999, stripeCustomerRef: "cus_evil" }]
  const ctx = {
    id: stored[0].id,
    email: stored[0].email!,
    name: stored[0].name,
    department: stored[0].department,
    role: "employee" as const,
  }
  const result = mergeNonAdminWrite("employees", tampered, stored, ctx, () => null)
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, /admin/)
})
