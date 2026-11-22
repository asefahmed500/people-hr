import type { Department, ID } from "./types"

export const EMPLOYEE_STATUSES = ["active", "leave", "remote", "inactive"] as const
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "intern"] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export const PAY_FREQUENCIES = ["monthly", "semi-monthly", "biweekly", "weekly", "annual"] as const
export type PayFrequency = (typeof PAY_FREQUENCIES)[number]

/** Common payroll currencies. Stored as ISO 4217 codes; the list is advisory. */
export const SALARY_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "PKR", "AED", "SAR"] as const

export type Employee = {
  id: ID
  name: string
  email: string
  initials: string
  department: Department
  role: string
  location: string
  status: EmployeeStatus
  avatar?: string
  /** Absolute hire date (YYYY-MM-DD). Source of truth for tenure; the legacy
   *  hiredDaysAgo field is kept only for documents written before it existed. */
  hiredAt?: string
  hiredDaysAgo: number
  phone?: string
  employmentType?: EmploymentType
  reportingManager?: string
  /** Gross salary in `salaryCurrency`. Optional — payroll only processes employees with one. */
  salary?: number
  /** ISO 4217 code for `salary`. Defaults to USD when omitted. */
  salaryCurrency?: string
  /** How often `salary` is paid. Defaults to monthly when omitted. */
  payFrequency?: PayFrequency
  /** Date from which this salary applies (YYYY-MM-DD). */
  salaryEffectiveDate?: string
  /** Stripe customer id — a stored reference only. No charge or payout is made. */
  stripeCustomerRef?: string
  /** Display-only card details returned by Stripe. Never a full card number. */
  cardBrand?: string
  cardLast4?: string
  /** Personnel-file documents attached to this employee record. */
  attachments?: import("./attachments").Attachment[]
}

export const defaultEmployees: Employee[] = []

export const newEmployee = (input: Omit<Employee, "id" | "initials" | "hiredDaysAgo">): Employee => ({
  ...input,
  id: `e-${Math.random().toString(36).slice(2, 9)}`,
  initials: input.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
  hiredAt: new Date().toISOString().slice(0, 10),
  hiredDaysAgo: 0,
})

/** Format a salary amount in its own currency, falling back to USD for old rows. */
export function formatSalary(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }
}
