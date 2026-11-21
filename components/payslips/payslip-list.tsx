"use client"

import { FileText, Printer } from "lucide-react"

import type { Payslip } from "@/lib/data/payslips"
import {
  formatPayslipMoney,
  grossPay,
  netPay,
  periodLabel,
  totalDeductions,
} from "@/lib/data/payslips"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type PayslipListProps = {
  payslips: Payslip[]
  onPreview: (payslip: Payslip) => void
}

export function PayslipList({ payslips, onPreview }: PayslipListProps) {
  if (payslips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-10 text-center">
        <FileText className="size-7 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-h4 text-foreground">No payslips yet</p>
        <p className="max-w-sm font-sans text-[12.5px] leading-normal text-muted-foreground">
          Generate payslips for a payroll period to see them here. Employees will only ever see their
          own statements.
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col overflow-clip rounded-lg border border-border bg-card">
      <div className="hidden grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.8fr_auto] gap-4 border-b border-b-border px-4 py-2.5 md:grid">
        {["Employee", "Period", "Gross", "Deductions", "Net pay", ""].map((h) => (
          <span
            key={h}
            className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
          >
            {h}
          </span>
        ))}
      </div>
      <ul className="flex flex-col">
        {payslips.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-b-border px-4 py-3 last:border-b-0 md:grid md:grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.8fr_auto]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-foreground/10 text-[11px] font-semibold text-primary">
                  {p.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-sans text-[13px] font-medium text-foreground">
                  {p.employeeName}
                </span>
                <span className="truncate font-sans text-[11px] text-muted-foreground">
                  {p.jobTitle} · {p.department}
                </span>
              </div>
            </div>
            <span className="font-sans text-[12.5px] text-secondary-foreground">
              {periodLabel(p.period)}
            </span>
            <span className="font-sans text-[12.5px] tabular-nums text-secondary-foreground">
              {formatPayslipMoney(grossPay(p.earnings))}
            </span>
            <span className="font-sans text-[12.5px] tabular-nums text-secondary-foreground">
              {formatPayslipMoney(totalDeductions(p.deductions))}
            </span>
            <span className="flex items-center gap-2 font-sans text-[13px] font-semibold tabular-nums text-foreground">
              {formatPayslipMoney(netPay(p))}
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 text-[10px] uppercase",
                  p.status === "paid"
                    ? "bg-foreground/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {p.status}
              </Badge>
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onPreview(p)}
                    aria-label={`Preview payslip for ${p.employeeName}`}
                    className="ml-auto"
                  >
                    <Printer className="size-4" strokeWidth={2} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Preview payslip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </li>
        ))}
      </ul>
    </div>
  )
}
