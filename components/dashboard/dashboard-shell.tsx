import { DashboardSidebar } from "./dashboard-sidebar"
import { TopBar } from "./top-bar"

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
    <div className="flex min-h-svh w-full bg-[#f6f4ef]">
      <DashboardSidebar activeHref={activeHref} />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-5">
        <TopBar current={current} accentCurrent={accentCurrent} />
        {children}
      </main>
    </div>
  )
}
