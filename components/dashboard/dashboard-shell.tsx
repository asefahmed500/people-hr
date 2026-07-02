import { DashboardShellClient } from "./dashboard-shell-client"

type DashboardShellProps = {
  activeHref: string
  current: string
  accentCurrent?: boolean
  children: React.ReactNode
}

export function DashboardShell({
  activeHref,
  current,
  accentCurrent = false,
  children,
}: DashboardShellProps) {
  return (
    <DashboardShellClient
      activeHref={activeHref}
      current={current}
      accentCurrent={accentCurrent}
    >
      {children}
    </DashboardShellClient>
  )
}
