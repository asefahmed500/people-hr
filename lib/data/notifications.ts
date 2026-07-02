import type { ID } from "./types"

export type NotificationType =
  | "leave_requested"
  | "leave_approved"
  | "leave_declined"
  | "employee_added"
  | "employee_deactivated"
  | "goal_updated"
  | "review_started"
  | "payroll_ran"
  | "report_generated"
  | "new_hire_added"
  | "project_created"
  | "candidate_moved"
  | "settings_changed"

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
  items: [
    {
      id: "n-1",
      type: "leave_requested",
      title: "Leave requested",
      description: "Marcus Bailey requested 1 day of Personal leave.",
      timestamp: "2025-02-21",
      read: false,
      href: "/leave",
    },
    {
      id: "n-2",
      type: "leave_approved",
      title: "Leave approved",
      description: "Sofia Alvarez's 5-day Vacation was approved.",
      timestamp: "2025-02-20",
      read: false,
      href: "/leave",
    },
    {
      id: "n-3",
      type: "employee_added",
      title: "New employee added",
      description: "A new employee has been added to the directory.",
      timestamp: "2025-02-19",
      read: true,
      href: "/employees",
    },
    {
      id: "n-4",
      type: "goal_updated",
      title: "Goal updated",
      description: "Grow ARR objective progress updated to 65%.",
      timestamp: "2025-02-18",
      read: true,
      href: "/goals",
    },
    {
      id: "n-5",
      type: "review_started",
      title: "Review started",
      description: "Q1 2025 performance review cycle has begun.",
      timestamp: "2025-02-17",
      read: true,
      href: "/performance",
    },
  ],
}
