import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[18px] border border-[#edeae3] bg-white p-5 ${className ?? ""}`}
    >
      <Skeleton className="h-4 w-1/3 bg-[#f1eee8]" />
      <Skeleton className="h-8 w-1/2 bg-[#f1eee8]" />
      <Skeleton className="h-3 w-2/3 bg-[#f1eee8]" />
    </div>
  )
}
