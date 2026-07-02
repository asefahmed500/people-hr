import {
  Globe,
  LayoutDashboard,
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
  FileText,
  ChartNoAxesColumn,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  icon: LucideIcon






  
  href: string
  badge?: { text: string; tone: "muted" | "accent" }
}

export const navItems: NavItem[] = [
  { label: "Landing page", icon: Globe, href: "/landing" },
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Employees", icon: Users, href: "/employees" },
  { label: "Organization", icon: Network, href: "/organization" },
  { label: "Attendance", icon: CalendarClock, href: "/attendance" },
  { label: "Leave", icon: PlaneTakeoff, href: "/leave" },
  {
    label: "Recruitment",
    icon: UserSearch,
    href: "/recruitment",
    badge: { text: "27", tone: "muted" },
  },
  { label: "Onboarding", icon: Rocket, href: "/onboarding" },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Performance", icon: TrendingUp, href: "/performance" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "Payroll", icon: Wallet, href: "/payroll" },
  { label: "Reports", icon: FileText, href: "/reports" },
  { label: "Analytics", icon: ChartNoAxesColumn, href: "/analytics" },
  {
    label: "AI Assistant",
    icon: Sparkles,
    href: "/assistant",
    badge: { text: "New", tone: "accent" },
  },
  { label: "Settings", icon: Settings, href: "/settings" },
]
