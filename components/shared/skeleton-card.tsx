import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <Skeleton className="h-4 w-1/3 bg-muted" />
      <Skeleton className="h-8 w-1/2 bg-muted" />
      <Skeleton className="h-3 w-2/3 bg-muted" />
    </div>
  )
}
