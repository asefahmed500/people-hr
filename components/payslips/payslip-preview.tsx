"use client"

import type { Payslip } from "@/lib/data/payslips"
import {
  DEDUCTIONS_LABELS,
  EARNINGS_LABELS,
  formatPayslipMoney,
  grossPay,
  netPay,
  periodLabel,
  totalDeductions,
  type PayslipDeductions,
  type PayslipEarnings,
} from "@/lib/data/payslips"

type PayslipPreviewProps = {
  payslip: Payslip
  companyName?: string
}

function Rows({
  labels,
  values,
}: {
  labels: Record<string, string>
  values: PayslipEarnings | PayslipDeductions
}) {
  return (
    <>
      {(Object.keys(labels) as Array<keyof typeof values>).map((key) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 py-1.5 font-sans text-[12.5px]"
        >
          <span className="text-secondary-foreground">{labels[key]}</span>
          <span className="tabular-nums text-foreground">{formatPayslipMoney(values[key])}</span>
        </div>
      ))}
    </>
  )
}

export function PayslipPreview({ payslip, companyName }: PayslipPreviewProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-col">
          <span className="font-sans text-[15px] font-semibold text-foreground">
            {companyName?.trim() || "Your Company"}
          </span>
          <span className="font-sans text-[11px] text-muted-foreground">People Operations</span>
        </div>
        <div className="text-right">
          <p className="text-h4 text-foreground">Salary Slip</p>
          <p className="font-sans text-[11.5px] text-muted-foreground">
            {periodLabel(payslip.period)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {[
          ["Employee", payslip.employeeName],
          ["Designation", payslip.jobTitle],
          ["Department", payslip.department],
          ["Issued", payslip.issuedAt],
        ].map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {label}
            </span>
            <span className="truncate font-sans text-[12.5px] text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col rounded-lg border border-border bg-muted/40 p-4">
          <h3 className="text-h5 text-foreground">Earnings</h3>
          <div className="mt-2 flex flex-col divide-y divide-border">
            <Rows labels={EARNINGS_LABELS} values={payslip.earnings} />
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-sans text-[12.5px] font-semibold">
            <span>Gross pay</span>
            <span className="tabular-nums">{formatPayslipMoney(grossPay(payslip.earnings))}</span>
          </div>
        </section>

        <section className="flex flex-col rounded-lg border border-border bg-muted/40 p-4">
          <h3 className="text-h5 text-foreground">Deductions</h3>
          <div className="mt-2 flex flex-col divide-y divide-border">
            <Rows labels={DEDUCTIONS_LABELS} values={payslip.deductions} />
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-sans text-[12.5px] font-semibold">
            <span>Total deductions</span>
            <span className="tabular-nums">
              {formatPayslipMoney(totalDeductions(payslip.deductions))}
            </span>
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg bg-foreground px-4 py-3 text-background">
        <span className="font-sans text-[13px] font-medium">Net pay</span>
        <span className="font-sans text-[22px] font-semibold tabular-nums">
          {formatPayslipMoney(netPay(payslip))}
        </span>
      </div>

      {payslip.notes ? (
        <p className="font-sans text-[12px] leading-normal text-muted-foreground">
          {payslip.notes}
        </p>
      ) : null}
      <p className="font-sans text-[11px] text-muted-foreground">
        This is a system-generated statement. No signature is required.
      </p>
    </div>
  )
}
