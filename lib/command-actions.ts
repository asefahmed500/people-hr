import {
  CalendarPlus,
  FileText,
  Goal,
  Sparkles,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type CommandAction = {
  id: string
  label: string
  hint: string
  icon: LucideIcon
}

export const commandActions: CommandAction[] = [
  {
    id: "add-employee",
    label: "Add employee",
    hint: "Employees",
    icon: UserPlus,
  },
  {
    id: "request-leave",
    label: "Request leave",
    hint: "Leave",
    icon: CalendarPlus,
  },
  {
    id: "post-job",
    label: "Post a job",
    hint: "Recruitment",
    icon: FileText,
  },
  {
    id: "new-goal",
    label: "New goal",
    hint: "Goals",
    icon: Goal,
  },
  {
    id: "run-payroll",
    label: "Run payroll",
    hint: "Payroll",
    icon: Wallet,
  },
  {
    id: "ask-ai",
    label: "Ask AI assistant",
    hint: "Assistant",
    icon: Sparkles,
  },
]

export function dispatchAction(id: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("peoplehr:action", { detail: { id } }))
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
