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
    dot: "bg-[#2f6f61]",
    bg: "bg-[#2f6f611a]",
    text: "text-[#2f6f61]",
    label: "Paid",
  },
  pending: {
    dot: "bg-[#d98a2b]",
    bg: "bg-[#d98a2b1a]",
    text: "text-[#b26a1f]",
    label: "Pending",
  },
  failed: {
    dot: "bg-[#e76f51]",
    bg: "bg-[#e76f511a]",
    text: "text-[#c4553a]",
    label: "Failed",
  },
}

export const defaultPayrollStore: PayrollStore = {
  payments: [
    { id: "pay-1", initials: "SJ", name: "Sophie Jensen", role: "Staff Engineer", department: "Engineering", gross: 12400, deductions: 3596, status: "paid" },
    { id: "pay-2", initials: "MK", name: "Marcus Kim", role: "Account Executive", department: "Sales", gross: 9800, deductions: 2842, status: "paid" },
    { id: "pay-3", initials: "AP", name: "Anika Patel", role: "Product Manager", department: "Product", gross: 10600, deductions: 3074, status: "pending" },
    { id: "pay-4", initials: "TW", name: "Tom Walsh", role: "Senior Designer", department: "Design", gross: 8200, deductions: 2378, status: "paid" },
    { id: "pay-5", initials: "RL", name: "Raquel Lopez", role: "Content Lead", department: "Marketing", gross: 9100, deductions: 2639, status: "pending" },
    { id: "pay-6", initials: "DN", name: "David Nguyen", role: "Backend Engineer", department: "Engineering", gross: 11200, deductions: 3248, status: "paid" },
    { id: "pay-7", initials: "CF", name: "Clara Fischer", role: "People Partner", department: "People", gross: 8800, deductions: 2552, status: "failed" },
  ],
  lastRun: null,
}
