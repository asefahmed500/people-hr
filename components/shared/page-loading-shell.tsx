import { Skeleton } from "@/components/ui/skeleton"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

type PageLoadingShellProps = {
  activeHref: string
  current: string
  children?: React.ReactNode
}

export function PageLoadingShell({
  activeHref,
  current,
  children,
}: PageLoadingShellProps) {
  return (
    <DashboardShell activeHref={activeHref} current={current} accentCurrent>
      <div className="flex w-full flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-7 w-48 bg-muted" />
            <Skeleton className="h-4 w-72 bg-muted" />
          </div>
          <div className="flex gap-2.5">
            <Skeleton className="h-9 w-24 rounded-lg bg-muted" />
            <Skeleton className="h-9 w-28 rounded-lg bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-3.5 w-20 bg-muted" />
              <Skeleton className="h-8 w-16 bg-muted" />
              <Skeleton className="h-3 w-24 bg-muted" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-4 h-5 w-40 bg-muted" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-muted" />
            ))}
          </div>
        </div>
        {children}
      </div>
    </DashboardShell>
  )
}
