import {
  CalendarPlus,
  FileText,
  Goal,
  BotMessageSquare,
  UserPlus,
  Wallet,
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
    id: "post-job",
    label: "Post a job",
    hint: "Recruitment",
    icon: FileText,
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
