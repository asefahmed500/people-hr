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
            <Skeleton className="h-7 w-48 bg-[#edeae3]" />
            <Skeleton className="h-4 w-72 bg-[#edeae3]" />
          </div>
          <div className="flex gap-2.5">
            <Skeleton className="h-9 w-24 rounded-[10px] bg-[#edeae3]" />
            <Skeleton className="h-9 w-28 rounded-[10px] bg-[#edeae3]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-[18px] border border-[#edeae3] bg-white p-5">
              <Skeleton className="h-3.5 w-20 bg-[#edeae3]" />
              <Skeleton className="h-8 w-16 bg-[#edeae3]" />
              <Skeleton className="h-3 w-24 bg-[#edeae3]" />
            </div>
          ))}
        </div>
        <div className="rounded-[18px] border border-[#edeae3] bg-white p-6">
          <Skeleton className="mb-4 h-5 w-40 bg-[#edeae3]" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-[#edeae3]" />
            ))}
          </div>
        </div>
        {children}
      </div>
    </DashboardShell>
  )
}
