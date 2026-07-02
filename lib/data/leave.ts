import type { ID, LeaveStatus, LeaveType } from "./types"

export type LeaveRequest = {
  id: ID
  employeeId: ID
  employeeName: string
  initials: string
  type: LeaveType
  status: LeaveStatus
  startDate: string
  endDate: string
  days: number
  reason: string
}

export type Balances = {
  annual: { used: number; total: number }
  sick: { used: number; total: number }
  personal: { used: number; total: number }
  parental: { used: number; total: number }
}

export type LeaveStore = {
  requests: LeaveRequest[]
  balances: Record<ID, Balances>
}

export const defaultBalances: Balances = {
  annual: { used: 15, total: 24 },
  sick: { used: 6, total: 25 },
  personal: { used: 2, total: 5 },
  parental: { used: 90, total: 150 },
}

export const defaultLeaveStore: LeaveStore = {
  requests: [
    {
      id: "lr-1",
      employeeId: "e-sofia",
      employeeName: "Sofia Alvarez",
      initials: "SA",
      type: "vac",
      status: "approved",
      startDate: "2025-02-24",
      endDate: "2025-02-28",
      days: 5,
      reason: "Family vacation",
    },
    {
      id: "lr-2",
      employeeId: "e-marcus",
      employeeName: "Marcus Bailey",
      initials: "MB",
      type: "pers",
      status: "pending",
      startDate: "2025-02-21",
      endDate: "2025-02-21",
      days: 1,
      reason: "Personal errand",
    },
    {
      id: "lr-3",
      employeeId: "e-priya",
      employeeName: "Priya Nair",
      initials: "PN",
      type: "vac",
      status: "pending",
      startDate: "2025-03-03",
      endDate: "2025-03-12",
      days: 8,
      reason: "Wedding",
    },
    {
      id: "lr-4",
      employeeId: "e-hana",
      employeeName: "Hana Lindqvist",
      initials: "HL",
      type: "sick",
      status: "declined",
      startDate: "2025-02-17",
      endDate: "2025-02-19",
      days: 3,
      reason: "Flu",
    },
  ],
  balances: {
    "e-asef": defaultBalances,
  },
}

export const leaveTypeLabel: Record<LeaveType, string> = {
  vac: "Vacation",
  sick: "Sick",
  pers: "Personal",
  par: "Parental",
}
