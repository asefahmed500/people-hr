import {
  CalendarPlus,
  FileText,
  Goal,
  BotMessageSquare,
  UserPlus,
  Wallet,
  ClipboardCheck,
  BarChart3,
  ListChecks,
  Megaphone,
  Clock,
  History,
  type LucideIcon,
} from "lucide-react"

export type CommandAction = {
  id: string
  label: string
  hint: string
  icon: LucideIcon
  route: string
  roles?: string[]
}

export const commandActions: CommandAction[] = [
  {
    id: "view-payslips",
    label: "View payslips",
    hint: "Payslips",
    icon: Wallet,
    route: "/payslips",
  },
  {
    id: "view-activity",
    label: "View activity log",
    hint: "Activity",
    icon: History,
    route: "/activity",
  },
  {
    id: "add-employee",
    label: "Add employee",
    hint: "Employees",
    icon: UserPlus,
    route: "/employees",
    roles: ["admin", "manager"],
  },
  {
    id: "request-leave",
    label: "Request leave",
    hint: "Leave",
    icon: CalendarPlus,
    route: "/leave",
  },
  {
    id: "check-attendance",
    label: "Check attendance today",
    hint: "Attendance",
    icon: Clock,
    route: "/attendance",
  },
  {
    id: "review-pending-leave",
    label: "Review pending leave",
    hint: "Leave",
    icon: ClipboardCheck,
    route: "/leave",
    roles: ["admin", "manager"],
  },
  {
    id: "post-job",
    label: "Post a job opening",
    hint: "Recruitment",
    icon: FileText,
    route: "/recruitment",
    roles: ["admin"],
  },
  {
    id: "screen-candidates",
    label: "Screen candidates",
    hint: "Recruitment",
    icon: ClipboardCheck,
    route: "/recruitment",
    roles: ["admin"],
  },
  {
    id: "new-goal",
    label: "New goal",
    hint: "Goals",
    icon: Goal,
    route: "/goals",
  },
  {
    id: "run-payroll",
    label: "Run payroll",
    hint: "Payroll",
    icon: Wallet,
    route: "/payroll",
    roles: ["admin"],
  },
  {
    id: "create-announcement",
    label: "Create announcement",
    hint: "Announcements",
    icon: Megaphone,
    route: "/announcements",
    roles: ["admin"],
  },
  {
    id: "view-analytics",
    label: "View analytics",
    hint: "Analytics",
    icon: BarChart3,
    route: "/analytics",
    roles: ["admin"],
  },
  {
    id: "generate-report",
    label: "Generate report",
    hint: "Reports",
    icon: FileText,
    route: "/reports",
    roles: ["admin"],
  },
  {
    id: "view-jobs",
    label: "View job queue",
    hint: "Jobs",
    icon: ListChecks,
    route: "/jobs",
    roles: ["admin"],
  },
  {
    id: "ask-ai",
    label: "Ask AI assistant",
    hint: "Assistant",
    icon: BotMessageSquare,
    route: "/assistant",
  },
]

// Pending action: set when triggering from the command palette so the target
// route can consume it on mount (navigation is async, so we can't just fire an
// event immediately — the target page's listener isn't registered yet).
let pendingAction: string | null = null

export function setPendingAction(id: string) {
  pendingAction = id
}

export function consumePendingAction(id: string): boolean {
  if (pendingAction === id) {
    pendingAction = null
    return true
  }
  return false
}

export function onAction(handler: (id: string) => void) {
  if (typeof window === "undefined") return () => {}
  const listener = (e: Event) => {
    const ce = e as CustomEvent<{ id: string }>
    handler(ce.detail.id)
  }
  window.addEventListener("peoplehr:action", listener)
  return () => window.removeEventListener("peoplehr:action", listener)
}
