import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  description?: string
  className?: string
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#edeae3] bg-[#faf9f6] p-8 text-center",
        className,
      )}
    >
      <p className="font-sans text-[13px] font-semibold text-[#1f2a26]">{title}</p>
      {description ? (
        <p className="font-sans text-[12px] leading-normal text-[#8a948d]">
          {description}
        </p>
      ) : null}
    </div>
  )
}
