import type { ID, PaymentStatus } from "./types"

export type Payment = {
  id: ID
  initials: string
  name: string
  role: string
  department: string
  gross: number
  deductions: number
  status: PaymentStatus
}

export type PayrollStore = {
  payments: Payment[]
  lastRun: string | null
}

export const formatMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 })

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
