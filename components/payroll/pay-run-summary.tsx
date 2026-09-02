import { Check } from "lucide-react"

import type { Payment } from "@/lib/data"
import { cn } from "@/lib/utils"

type Figure = {
  label: string
  value: string
}

type Step = {
  title: string
  sublabel: string
  state: "done" | "current" | "todo"
}

function runDateLabel(lastRun: string | null): string {
  if (!lastRun) return ""
  return new Date(lastRun).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function PayRunSummary({
  payments,
  lastRun,
}: {
  payments: Payment[]
  lastRun: string | null
}) {
  const totalGross = payments.reduce((s, p) => s + p.gross, 0)
  const totalDeductions = payments.reduce((s, p) => s + p.deductions, 0)
  const totalNet = totalGross - totalDeductions
  const employerCost = Math.round(totalGross * 1.096)

  const figures: Figure[] = [
    { label: "Gross pay", value: `$${totalGross.toLocaleString()}` },
    { label: "Taxes & deductions", value: `$${totalDeductions.toLocaleString()}` },
    { label: "Net pay", value: `$${totalNet.toLocaleString()}` },
    { label: "Employer cost", value: `$${employerCost.toLocaleString()}` },
  ]

  const due = payments.filter(
    (p) => p.status === "pending" || p.status === "failed",
  ).length
  const ran = !!lastRun
  const steps: Step[] = [
    { title: "Draft", sublabel: "Ready", state: "done" },
    { title: "In review", sublabel: "Reviewed", state: "done" },
    ran
      ? { title: "Approved", sublabel: "Approved", state: "done" }
      : {
          title: "Approved",
          sublabel: due > 0 ? "Awaiting run" : "All paid",
          state: due > 0 ? "current" : "done",
        },
    ran
      ? {
          title: "Paid",
          sublabel: `Paid ${runDateLabel(lastRun)}`,
          state: "done",
        }
      : { title: "Paid", sublabel: due > 0 ? "Not yet run" : "Nothing due", state: "todo" },
  ]

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex">
        {figures.map((fig, idx) => (
          <div key={fig.label} className="contents">
            <div
              className={cn(
                "flex flex-1 flex-col gap-1 py-0",
                idx === 0 && "pl-0 pr-8",
                idx === figures.length - 1 && "pl-8 pr-0",
                idx > 0 && idx < figures.length - 1 && "px-8",
              )}
            >
              <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
                {fig.label}
              </span>
              <span className="text-stat">
                {fig.value}
              </span>
            </div>
            {idx < figures.length - 1 ? (
              <span className="flex w-px shrink-0 flex-col bg-border" />
            ) : null}
          </div>
        ))}
      </div>
      <span className="flex h-px w-full flex-col bg-border" />
      <div className="flex items-center">
        {steps.map((step, idx) => (
          <StepItem key={step.title} step={step} last={idx === steps.length - 1} />
        ))}
      </div>
    </div>
  )
}

function StepItem({ step, last }: { step: Step; last: boolean }) {
  return (
    <div className={cn("flex flex-1 items-center gap-3", last && "flex-none")}>
      <StepCircle state={step.state} />
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "font-sans inline-block text-[12.5px] leading-normal",
            step.state === "current"
              ? "font-semibold text-primary"
              : step.state === "done"
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground",
          )}
        >
          {step.title}
        </span>
        <span
          className={cn(
            "font-sans inline-block text-[11px] leading-normal",
            step.state === "todo" ? "text-muted-foreground" : "text-muted-foreground",
          )}
        >
          {step.sublabel}
        </span>
      </div>
      {!last ? (
        <span
          className={cn(
            "mx-2 my-0 flex h-0.5 flex-1 flex-col",
            step.state === "done"
              ? "bg-primary"
              : step.state === "current"
                ? "bg-muted"
                : "bg-border",
          )}
        />
      ) : null}
    </div>
  )
}

function StepCircle({ state }: { state: Step["state"] }) {
  if (state === "done") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
        <Check className="size-3.5 text-primary-foreground" strokeWidth={2} />
      </div>
    )
  }
  if (state === "current") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card">
        <span className="size-2.5 rounded-full bg-primary" />
      </div>
    )
  }
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card">
      <span className="size-2.5 rounded-full bg-muted" />
    </div>
  )
}
