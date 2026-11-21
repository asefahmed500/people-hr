"use client"

import { Download, Play } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PayrollHeader({
  employeeCount,
  onExport,
  onRunPayroll,
}: {
  employeeCount?: number
  onExport?: () => void
  onRunPayroll?: () => void
}) {
  const now = new Date()
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Payroll
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          {monthYear} pay run{employeeCount != null ? ` · ${employeeCount} employees` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <Button type="button" variant="outline" onClick={onExport}>
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          Export report
        </Button>
        <Button type="button" onClick={onRunPayroll}>
          <Play className="size-4" strokeWidth={2} aria-hidden="true" />
          Run payroll
        </Button>
      </div>
    </div>
  )
}
