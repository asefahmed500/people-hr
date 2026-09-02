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
