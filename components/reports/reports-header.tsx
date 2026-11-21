import { Calendar, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

function currentQuarter(): string {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + 1
  return `Q${q} ${now.getFullYear()}`
}

type ReportsHeaderProps = {
  onNewReport?: () => void
}

export function ReportsHeader({ onNewReport }: ReportsHeaderProps) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Reports
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          Build, schedule and export reports across HR, payroll and engagement
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4">
          <Calendar className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            {currentQuarter()}
          </span>
        </span>
        <Button type="button" onClick={onNewReport}>
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          New report
        </Button>
      </div>
    </div>
  )
}
