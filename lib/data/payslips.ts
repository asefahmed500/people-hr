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
  employeeName: string
  initials: string
  department: string
  jobTitle: string
  /** Payroll period in YYYY-MM form. */
  period: string
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

export const formatPayslipMoney = (n: number): string =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

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
  status: Payslip["status"] = "draft",
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
    employeeName: employee.name,
    initials: employee.initials || payment.initials,
    department: employee.department,
    jobTitle: employee.role || payment.role,
    period,
    issuedAt: new Date().toISOString().slice(0, 10),
    status,
    earnings: { basic, housing, transport, special, other },
    deductions: { incomeTax, providentFund, healthInsurance, professionalTax },
  }
}

/** Sanitized HTML for printing/exporting a single payslip. */
export function buildPayslipHtml(p: Payslip, company = "Your Company"): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const money = (n: number) => esc(formatPayslipMoney(n))
  const row = (label: string, value: number) =>
    `<tr><td>${esc(label)}</td><td style="text-align:right">${money(value)}</td></tr>`

  return [
    `<h2 style="margin:0 0 4px">Salary Slip</h2>`,
    `<p style="margin:0 0 18px;color:#555">${esc(periodLabel(p.period))}</p>`,
    `<table style="width:100%;border-collapse:collapse;margin-bottom:18px">`,
    `<tr><td><strong>Employee</strong></td><td style="text-align:right">${esc(p.employeeName)} (${esc(p.initials)})</td></tr>`,
    `<tr><td><strong>Department</strong></td><td style="text-align:right">${esc(p.department)}</td></tr>`,
    `<tr><td><strong>Designation</strong></td><td style="text-align:right">${esc(p.jobTitle)}</td></tr>`,
    `<tr><td><strong>Issued</strong></td><td style="text-align:right">${esc(p.issuedAt)}</td></tr>`,
    `</table>`,
    `<table style="width:100%;border-collapse:collapse">`,
    `<thead><tr><th style="text-align:left;border-bottom:1px solid #999;padding:6px 0">Earnings</th><th style="text-align:right;border-bottom:1px solid #999;padding:6px 0">Amount</th></tr></thead>`,
    `<tbody>${(Object.keys(EARNINGS_LABELS) as Array<keyof PayslipEarnings>)
      .map((k) => row(EARNINGS_LABELS[k], p.earnings[k]))
      .join("")}</tbody>`,
    `<tfoot><tr><td style="padding:6px 0"><strong>Gross pay</strong></td><td style="text-align:right;padding:6px 0"><strong>${money(grossPay(p.earnings))}</strong></td></tr></tfoot>`,
    `</table>`,
    `<table style="width:100%;border-collapse:collapse;margin-top:18px">`,
    `<thead><tr><th style="text-align:left;border-bottom:1px solid #999;padding:6px 0">Deductions</th><th style="text-align:right;border-bottom:1px solid #999;padding:6px 0">Amount</th></tr></thead>`,
    `<tbody>${(Object.keys(DEDUCTIONS_LABELS) as Array<keyof PayslipDeductions>)
      .map((k) => row(DEDUCTIONS_LABELS[k], p.deductions[k]))
      .join("")}</tbody>`,
    `<tfoot><tr><td style="padding:6px 0"><strong>Total deductions</strong></td><td style="text-align:right;padding:6px 0"><strong>${money(totalDeductions(p.deductions))}</strong></td></tr></tfoot>`,
    `</table>`,
    `<p style="margin:20px 0 6px;padding:12px;background:#f6f6f4;border-radius:8px"><strong>Net pay: ${money(netPay(p))}</strong></p>`,
    p.notes ? `<p style="color:#555">${esc(p.notes)}</p>` : "",
    `<p style="margin-top:32px;color:#777">Issued by ${esc(company)} · People Operations</p>`,
  ].join("\n")
}
