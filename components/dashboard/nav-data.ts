import {
  LayoutDashboard,
  History,
  Users,
  Network,
  CalendarClock,
  PlaneTakeoff,
  UserSearch,
  Rocket,
  FolderKanban,
  TrendingUp,
  Target,
  Wallet,
  ReceiptText,
  FileText,
  FileSignature,
  Megaphone,
  ChartNoAxesColumn,
  ListChecks,
  BotMessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  icon: LucideIcon
  href: string
  badge?: { text: string; tone: "muted" | "accent" }
  roles?: string[] // visible to these roles (undefined = all)
}

export const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Activity", icon: History, href: "/activity" },
  { label: "Employees", icon: Users, href: "/employees", roles: ["admin", "manager"] },
  { label: "Organization", icon: Network, href: "/organization", roles: ["admin"] },
  { label: "Attendance", icon: CalendarClock, href: "/attendance" },
  { label: "Leave", icon: PlaneTakeoff, href: "/leave" },
  { label: "Recruitment", icon: UserSearch, href: "/recruitment", roles: ["admin"] },
  { label: "Onboarding", icon: Rocket, href: "/onboarding", roles: ["admin", "manager"] },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Performance", icon: TrendingUp, href: "/performance" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "Payroll", icon: Wallet, href: "/payroll", roles: ["admin"] },
  { label: "Payslips", icon: ReceiptText, href: "/payslips" },
  { label: "Reports", icon: FileText, href: "/reports", roles: ["admin"] },
  { label: "Documents", icon: FileSignature, href: "/documents", roles: ["admin"] },
  { label: "Analytics", icon: ChartNoAxesColumn, href: "/analytics", roles: ["admin"] },
  { label: "Jobs", icon: ListChecks, href: "/jobs", roles: ["admin"] },
  { label: "AI Assistant", icon: BotMessageSquare, href: "/assistant" },
  { label: "Announcements", icon: Megaphone, href: "/announcements" },
  { label: "Settings", icon: Settings, href: "/settings" },
]
