import type { ID } from "./types"

export type NotificationType =
  | "leave_requested"
  | "leave_approved"
  | "leave_declined"
  | "leave_cancelled"
  | "employee_added"
  | "employee_deactivated"
  | "goal_updated"
  | "review_started"
  | "payroll_ran"
  | "report_generated"
  | "new_hire_added"
  | "project_created"
  | "project_updated"
  | "project_moved"
  | "candidate_moved"
  | "job_posted"
  | "attendance_marked"
  | "attendance_updated"
  | "settings_changed"
  | "document_generated"

export type Notification = {
  id: ID
  type: NotificationType
  title: string
  description: string
  timestamp: string
  read: boolean
  href?: string
}

export type NotificationsStore = {
  items: Notification[]
}

export function newNotification(
  overrides: Partial<Notification> & { title: string; description: string },
): Notification {
  const now = new Date()
  const iso = now.toISOString().split("T")[0]
  return {
    id: `n-${Math.random().toString(36).slice(2, 9)}`,
    type: "settings_changed",
    timestamp: iso,
    read: false,
    ...overrides,
  }
}


export const defaultNotificationsStore: NotificationsStore = {
  items: [],
}
