import type { Department, ID } from "./types"

export const EMPLOYEE_STATUSES = ["active", "leave", "remote", "inactive"] as const
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "intern"] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

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
  /** Monthly gross salary (USD). Optional — payroll only processes employees with one. */
  salary?: number
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
