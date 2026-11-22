import type { Employee } from "./employees"
import type { ID, PaymentStatus } from "./types"
import { currentPeriod } from "./payslips"

export type Payment = {
  id: ID
  /** Stable link to the directory row. Older payment rows may not have it. */
  employeeId?: ID
  /** Verified email bridges `e-*` directory ids to `u-*` login account ids. */
  employeeEmail?: string
  /** Pay period in YYYY-MM form. Older payment rows may not have it. */
  period?: string
  /** ISO 4217 code for `gross`/`deductions`. Defaults to USD for old rows. */
  currency?: string
  initials: string
  name: string
  role: string
  department: string
  gross: number
  deductions: number
  status: PaymentStatus
  /** Stored reference for an external payment batch/Stripe customer. No money moves. */
  paymentReference?: string
  recordedAt?: string
}

export type PayrollStore = {
  payments: Payment[]
  lastRun: string | null
}

export const formatMoney = (n: number, currency = "USD") => {
  try {
    return n.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 })
  } catch {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
  }
}

export const paymentStatusStyles: Record<
  PaymentStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  paid: {
    dot: "bg-primary",
    bg: "bg-foreground/10",
    text: "text-primary",
    label: "Paid",
  },
  pending: {
    dot: "bg-secondary-foreground",
    bg: "bg-foreground/10",
    text: "text-secondary-foreground",
    label: "Pending",
  },
  failed: {
    dot: "bg-foreground",
    bg: "bg-foreground/10",
    text: "text-foreground",
    label: "Failed",
  },
}

export const defaultPayrollStore: PayrollStore = {
  payments: [],
  lastRun: null,
}

/** One payment row per employee per period, so runs build a real history. */
export const paymentId = (employeeId: ID, period: string) => `pay-${employeeId}-${period}`

/** Find a payment for an employee in a period, including pre-period legacy rows. */
export function findPayment(
  payments: Payment[],
  employeeId: ID,
  period: string,
): Payment | undefined {
  return payments.find(
    (p) => p.id === paymentId(employeeId, period) || (p.employeeId === employeeId && p.period === period),
  )
}

/** Build a pending payment from the directory. The amount is a snapshot: later
 *  salary edits do not rewrite a period that has already been recorded. */
export function buildPayment(
  employee: Employee,
  period: string = currentPeriod(),
  recordedAt = new Date().toISOString(),
): Payment {
  return {
    id: paymentId(employee.id, period),
    employeeId: employee.id,
    employeeEmail: employee.email || undefined,
    period,
    currency: employee.salaryCurrency || "USD",
    initials: employee.initials,
    name: employee.name,
    role: employee.role,
    department: employee.department,
    gross: employee.salary ?? 0,
    deductions: 0,
    status: "pending",
    paymentReference: employee.stripeCustomerRef,
    recordedAt,
  }
}

/**
 * Plan a payroll run. Pure so the rules are unit-testable: it snapshots eligible
 * employees into period-keyed rows and marks pending/failed rows as recorded.
 * Nothing here moves money — "paid" means "recorded and exported".
 */
export function planPayrollRun(
  payments: Payment[],
  employees: Employee[],
  period: string = currentPeriod(),
  recordedAt = new Date().toISOString(),
): {
  payments: Payment[]
  generated: Payment[]
  processed: number
  skipped: Employee[]
} {
  const active = employees.filter((e) => e.status !== "inactive")
  const hasSalary = (e: Employee) => typeof e.salary === "number" && e.salary > 0
  const eligible = active.filter((e) => hasSalary(e) && !findPayment(payments, e.id, period))
  const skipped = active.filter((e) => !hasSalary(e))

  const generated = eligible.map((e) => buildPayment(e, period, recordedAt))
  const all = [...payments, ...generated]
  // Only rows belonging to this period (plus pre-period legacy rows) count.
  const processed = all.filter(
    (p) =>
      (p.status === "pending" || p.status === "failed") &&
      (!p.period || p.period === period),
  ).length

  return {
    payments: all.map((p) =>
      p.status === "pending" || p.status === "failed"
        ? { ...p, status: "paid" as const, recordedAt: p.recordedAt ?? recordedAt }
        : p,
    ),
    generated,
    processed,
    skipped,
  }
}
