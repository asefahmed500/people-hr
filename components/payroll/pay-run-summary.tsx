import { Check } from "lucide-react"

import type { Payment } from "@/lib/data"
import { cn } from "@/lib/utils"

type Figure = {
  label: string
  value: string
}

const defaultFigures: Figure[] = [
  { label: "Gross pay", value: "$1,482,600" },
  { label: "Taxes & deductions", value: "$421,340" },
  { label: "Net pay", value: "$1,061,260" },
  { label: "Employer cost", value: "$1,624,900" },
]

type Step = {
  title: string
  sublabel: string
  state: "done" | "current" | "todo"
}

const steps: Step[] = [
  { title: "Draft", sublabel: "Completed Feb 10", state: "done" },
  { title: "In review", sublabel: "Completed Feb 15", state: "done" },
  { title: "Approved", sublabel: "Current step", state: "current" },
  { title: "Paid", sublabel: "Due Feb 28", state: "todo" },
]

export function PayRunSummary({ payments }: { payments?: Payment[] }) {
  const totalGross = payments?.reduce((s, p) => s + p.gross, 0) ?? 0
  const totalDeductions = payments?.reduce((s, p) => s + p.deductions, 0) ?? 0
  const totalNet = totalGross - totalDeductions
  const employerCost = Math.round(totalGross * 1.096)

  const figures: Figure[] = payments
    ? [
        { label: "Gross pay", value: `$${totalGross.toLocaleString()}` },
        { label: "Taxes & deductions", value: `$${totalDeductions.toLocaleString()}` },
        { label: "Net pay", value: `$${totalNet.toLocaleString()}` },
        { label: "Employer cost", value: `$${employerCost.toLocaleString()}` },
      ]
    : defaultFigures

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl border border-[#edeae3] bg-white p-6 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
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
              <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
                {fig.label}
              </span>
              <span className="font-display inline-block text-2xl font-semibold leading-tight text-[#1f2a26]">
                {fig.value}
              </span>
            </div>
            {idx < figures.length - 1 ? (
              <span className="flex w-px shrink-0 flex-col bg-[#edeae3]" />
            ) : null}
          </div>
        ))}
      </div>
      <span className="flex h-px w-full flex-col bg-[#edeae3]" />
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
              ? "font-semibold text-[#2f6f61]"
              : step.state === "done"
                ? "font-semibold text-[#1f2a26]"
                : "font-medium text-[#8a948d]",
          )}
        >
          {step.title}
        </span>
        <span
          className={cn(
            "font-sans inline-block text-[11px] leading-normal",
            step.state === "todo" ? "text-[#b0b7af]" : "text-[#8a948d]",
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
              ? "bg-[#2f6f61]"
              : step.state === "current"
                ? "bg-[#d1e8e3]"
                : "bg-[#e5e0d6]",
          )}
        />
      ) : null}
    </div>
  )
}

function StepCircle({ state }: { state: Step["state"] }) {
  if (state === "done") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2f6f61]">
        <Check className="size-3.5 text-white" strokeWidth={2} />
      </div>
    )
  }
  if (state === "current") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#2f6f61] bg-white">
        <span className="size-2.5 rounded-full bg-[#2f6f61]" />
      </div>
    )
  }
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#d1cec8] bg-white">
      <span className="size-2.5 rounded-full bg-[#c3c8c0]" />
    </div>
  )
}
