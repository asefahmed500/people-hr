import { Server } from "lucide-react"

export function JobsHeader() {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">Jobs</h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          Monitor background work, retry failures and enqueue jobs by hand.
        </p>
      </div>
      <span className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-border bg-card px-3">
        <Server className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
        <span className="font-sans text-[12.5px] font-medium leading-normal text-secondary-foreground">
          Operations
        </span>
      </span>
    </div>
  )
}
