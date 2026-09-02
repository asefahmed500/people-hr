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
  /** True for a single half-day request (days = 0.5). */
  halfDay?: boolean
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

/** Standard entitlement granted to every new account on first read. */
export const defaultBalances: Balances = {
  annual: { used: 0, total: 24 },
  sick: { used: 0, total: 25 },
  personal: { used: 0, total: 5 },
  parental: { used: 0, total: 150 },
}

export const defaultLeaveStore: LeaveStore = {
  requests: [],
  balances: {},
}

export const leaveTypeLabel: Record<LeaveType, string> = {
  vac: "Vacation",
  sick: "Sick",
  pers: "Personal",
  par: "Parental",
}

const typeBalanceKey: Record<LeaveType, "annual" | "sick" | "personal" | "parental"> = {
  vac: "annual",
  sick: "sick",
  pers: "personal",
  par: "parental",
}

/** Adjust a leave balance by a signed day delta (shared by leave page + dashboard). */
export function adjustBalance(
  balances: Record<ID, Balances>,
  req: LeaveRequest,
  deltaDays: number,
): Record<ID, Balances> {
  const key = typeBalanceKey[req.type]
  const current = balances[req.employeeId] ?? defaultBalances
  const used = Math.max(0, current[key].used + deltaDays)
  return {
    ...balances,
    [req.employeeId]: { ...current, [key]: { ...current[key], used } },
  }
}
