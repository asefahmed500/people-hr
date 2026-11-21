import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  buildLetterBody,
} from "../lib/data/documents"
import {
  buildPayslip,
  buildPayslipHtml,
  grossPay,
  netPay,
  periodLabel,
  totalDeductions,
} from "../lib/data/payslips"
import type { Employee } from "../lib/data/employees"
import type { Payment } from "../lib/data/payroll"

const ctx = {
  employeeName: "Alex <script>alert(1)</script>",
  department: "Engineering",
  jobTitle: "Engineer",
  startDate: "2026-01-01",
  endDate: "2026-11-20",
  monthlySalary: "USD 6,500",
  purpose: "a visa application",
  reason: "late arrivals",
}

test("every document type has a label and generates escaped letter HTML", () => {
  assert.equal(DOCUMENT_TYPES.length, 20)
  for (const type of DOCUMENT_TYPES) {
    assert.ok(DOCUMENT_TYPE_LABELS[type], `missing label for ${type}`)
    const html = buildLetterBody(type, ctx, "North Wind")
    assert.match(html, /<p>/)
    assert.match(html, /North Wind/)
    // The employee name is interpolated everywhere through the esc() helper.
    assert.doesNotMatch(html, /<script>/)
  }
})

test("offer and termination letters include the key facts", () => {
  const offer = buildLetterBody("offer", ctx, "North Wind")
  assert.match(offer, /start date/i)
  assert.match(offer, /6,500/)

  const termination = buildLetterBody("termination", ctx, "North Wind")
  assert.match(termination, /last working day/i)
  assert.match(termination, /late arrivals/)
})

const employee: Employee = {
  id: "e1",
  name: "Alex Doe",
  email: "alex@example.com",
  initials: "AD",
  department: "Engineering",
  role: "Engineer",
  location: "Remote",
  status: "active",
  hiredDaysAgo: 10,
}
const payment: Payment = {
  id: "e1",
  initials: "AD",
  name: "Alex Doe",
  role: "Engineer",
  department: "Engineering",
  gross: 6500,
  deductions: 1300,
  status: "paid",
}

test("payslip totals reconcile exactly with payroll", () => {
  const slip = buildPayslip(employee, payment, "2026-11", "paid")
  assert.equal(grossPay(slip.earnings), payment.gross)
  assert.equal(totalDeductions(slip.deductions), payment.deductions)
  assert.equal(netPay(slip), payment.gross - payment.deductions)
  assert.equal(periodLabel("2026-11"), "November 2026")
})

test("payslip HTML is printable and escapes names", () => {
  const slip = buildPayslip({ ...employee, name: "Alex <b>Doe</b>" }, payment, "2026-11")
  const html = buildPayslipHtml(slip, "North Wind")
  assert.match(html, /Salary Slip/)
  assert.match(html, /Net pay/)
  assert.match(html, /5,200/)
  assert.doesNotMatch(html, /<b>Doe<\/b>/)
})
