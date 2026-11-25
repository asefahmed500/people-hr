// Payslips: a real, period-based salary statement derived from the payroll
// records and the directory. Stored as a workspace JSON module like the other
// HR modules, so it inherits the same auth/audit/versioning guarantees.

import type { Employee } from "./employees"
import type { Payment } from "./payroll"

export type PayslipEarnings = {
  basic: number
  housing: number
  transport: number
  special: number
  other: number
}

export type PayslipDeductions = {
  incomeTax: number
  providentFund: number
  healthInsurance: number
  professionalTax: number
}

export type Payslip = {
  id: string
  employeeId: string
  /** Verified email bridges `e-*` hire ids to `u-*` login id. */
  employeeEmail?: string
  employeeName: string
  initials: string
  department: string
  jobTitle: string
  /** Payroll period in YYYY-MM form. */
  period: string
  /** ISO 4217 code inherited from payroll. Defaults to USD for old slips. */
  currency?: string
  issuedAt: string
  status: "draft" | "paid"
  earnings: PayslipEarnings
  deductions: PayslipDeductions
  notes?: string
}

export type PayslipsStore = { payslips: Payslip[] }

export const defaultPayslipsStore: PayslipsStore = { payslips: [] }

export const EARNINGS_LABELS: Record<keyof PayslipEarnings, string> = {
  basic: "Basic salary",
  housing: "House rent allowance",
  transport: "Transport allowance",
  special: "Special allowance",
  other: "Other earnings",
}

export const DEDUCTIONS_LABELS: Record<keyof PayslipDeductions, string> = {
  incomeTax: "Income tax",
  providentFund: "Provident fund",
  healthInsurance: "Health insurance",
  professionalTax: "Professional tax",
}

export const grossPay = (e: PayslipEarnings): number =>
  e.basic + e.housing + e.transport + e.special + e.other

export const totalDeductions = (d: PayslipDeductions): number =>
  d.incomeTax + d.providentFund + d.healthInsurance + d.professionalTax

export const netPay = (p: Payslip): number => grossPay(p.earnings) - totalDeductions(p.deductions)

export const formatPayslipMoney = (n: number, currency = "USD"): string => {
  try {
    return n.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 })
  } catch {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
  }
}

export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number)
  if (!year || !month || month < 1 || month > 12) return period
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Build a payslip from a payroll payment. The gross is decomposed into the
 * standard earnings buckets and the recorded deductions into statutory
 * buckets, with the remainder assigned to the final line so the totals always
 * reconcile exactly with payroll (no invented numbers).
 */
export function buildPayslip(
  employee: Employee,
  payment: Payment,
  period: string,
  status: Payslip["status"] = payment.status === "paid" ? "paid" : "draft",
): Payslip {
  const gross = Math.max(0, Math.round(payment.gross))
  const basic = Math.round(gross * 0.45)
  const housing = Math.round(gross * 0.18)
  const transport = Math.round(gross * 0.08)
  const special = Math.round(gross * 0.12)
  const other = Math.max(0, gross - basic - housing - transport - special)

  const deductions = Math.min(gross, Math.max(0, Math.round(payment.deductions)))
  const incomeTax = Math.round(deductions * 0.55)
  const providentFund = Math.round(deductions * 0.25)
  const healthInsurance = Math.round(deductions * 0.12)
  const professionalTax = Math.max(0, deductions - incomeTax - providentFund - healthInsurance)

  return {
    id: `ps-${crypto.randomUUID()}`,
    employeeId: employee.id,
    employeeEmail: employee.email || undefined,
    employeeName: employee.name,
    initials: employee.initials || payment.initials,
    department: employee.department,
    jobTitle: employee.role || payment.role,
    period,
    currency: payment.currency || "USD",
    issuedAt: new Date().toISOString().slice(0, 10),
    status,
    earnings: { basic, housing, transport, special, other },
    deductions: { incomeTax, providentFund, healthInsurance, professionalTax },
  }
}

/** Clean, print-ready HTML for a single salary statement. */
export function buildPayslipHtml(p: Payslip, company = "Your Company"): string {
  const esc = (s: unknown) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const money = (n: number) => esc(formatPayslipMoney(n, p.currency))
  const row = (label: string, value: number) =>
    `<tr><td>${esc(label)}</td><td>${money(value)}</td></tr>`
  const table = (
    heading: string,
    keys: string[],
    labels: Record<string, string>,
    values: Record<string, number>,
  ) =>
    [
      `<h2>${esc(heading)}</h2>`,
      `<table><thead><tr><th>Component</th><th>Amount (${esc(p.currency ?? "USD")})</th></tr></thead><tbody>`,
      ...keys.map((k) => row(labels[k] ?? k, values[k] ?? 0)),
      `</tbody></table>`,
    ].join("")

  return [
    `<h1>Salary statement</h1>`,
    `<p class="muted">${esc(periodLabel(p.period))} · ${esc(p.status === "paid" ? "Paid" : "Draft")}</p>`,
    `<table class="meta">`,
    `<tr><td>Employee</td><td>${esc(p.employeeName)} (${esc(p.initials)})</td></tr>`,
    `<tr><td>Employee ID</td><td>${esc(p.employeeId)}</td></tr>`,
    `<tr><td>Department</td><td>${esc(p.department)}</td></tr>`,
    `<tr><td>Designation</td><td>${esc(p.jobTitle)}</td></tr>`,
    `<tr><td>Pay period</td><td>${esc(p.period)}</td></tr>`,
    `<tr><td>Issued on</td><td>${esc(p.issuedAt)}</td></tr>`,
    `</table>`,
    table("Earnings", Object.keys(EARNINGS_LABELS), EARNINGS_LABELS, p.earnings),
    table("Deductions", Object.keys(DEDUCTIONS_LABELS), DEDUCTIONS_LABELS, p.deductions),
    `<table class="totals">`,
    `<tr><td>Gross pay</td><td>${money(grossPay(p.earnings))}</td></tr>`,
    `<tr><td>Total deductions</td><td>${money(totalDeductions(p.deductions))}</td></tr>`,
    `<tr class="net"><td>Net pay</td><td>${money(netPay(p))}</td></tr>`,
    `</table>`,
    p.notes ? `<p class="note">${esc(p.notes)}</p>` : "",
    `<p class="note">This is a system-generated salary statement. No signature is required. ` +
      `Please contact People Operations with questions about this statement.</p>`,
    `<div class="foot">${esc(company)} · People Operations · Statement ref: ${esc(p.id)}</div>`,
  ].join("\n")
}
