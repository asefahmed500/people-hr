import type { ID } from "./types"

export type SessionUser = {
  id: ID
  name: string
  email: string
  role: string
  initials: string
  department: string | null
  managerId: string | null
  twoFactorEnabled?: boolean
}

export const DEMO_EMAIL = "asef.ahmed@northwind.co"
export const DEMO_PASSWORD = "demo1234"

/** Accounts offered by the login-page demo picker. All are created by the seed
 *  with the shared demo password so every role can be explored immediately. */
export const DEMO_ACCOUNTS = [
  {
    id: "admin",
    label: "Administrator",
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    description: "Full access to every module",
  },
  {
    id: "manager",
    label: "Manager",
    email: "manager@northwind.co",
    password: DEMO_PASSWORD,
    description: "Department-scoped views and approvals",
  },
  {
    id: "employee",
    label: "Employee",
    email: "emp@northwind.co",
    password: DEMO_PASSWORD,
    description: "Own records, leave requests and payslips",
  },
] as const

export type DemoAccountId = (typeof DEMO_ACCOUNTS)[number]["id"]
