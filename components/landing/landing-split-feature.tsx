import { Check, Inbox } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const approvals = [
  { initials: "AC", name: "Ava Chen", detail: "Annual leave · 3 days" },
  { initials: "LM", name: "Liam Ortiz", detail: "Remote work · Fri" },
  { initials: "SR", name: "Sara Bloom", detail: "Expense · $128.40" },
]

const checks = [
  "Policy-based routing and auto-approvals",
  "One-click approve, deny or delegate",
  "A full audit trail on every decision",
]

export function LandingSplitFeature() {
  return (
    <section
      id="solutions"
      className="flex w-full flex-col items-center gap-14 border-y border-border bg-card px-5 py-[92px] sm:px-10 lg:flex-row lg:items-center lg:px-20"
    >
      <div className="flex w-full shrink-0 justify-center lg:w-[540px]">
        <div className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Inbox className="size-[18px] text-foreground" strokeWidth={2} aria-hidden="true" />
              </div>
              <span className="text-h4 font-semibold">
                Approvals inbox
              </span>
            </div>
            <Badge className="h-6 rounded-md px-2.5 font-sans text-[11px] font-medium leading-normal">
              3 new
            </Badge>
          </div>

          {approvals.map((row) => (
            <div
              key={row.initials}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <Avatar className="size-9 bg-muted">
                <AvatarFallback className="bg-transparent font-sans text-xs font-semibold leading-normal text-foreground">
                  {row.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="font-sans text-[13px] font-semibold leading-normal text-foreground">
                  {row.name}
                </span>
                <span className="font-sans text-xs leading-normal text-muted-foreground">
                  {row.detail}
                </span>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground">
                <Check className="size-4 text-background" strokeWidth={2} aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[22px]">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          One inbox for everything
        </p>
        <h2 className="max-w-[440px] text-[20px] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground sm:text-[24px]">
          Every people request, handled in one calm place
        </h2>
        <p className="max-w-[460px] font-sans text-sm leading-[1.6] text-muted-foreground sm:text-[15px]">
          Leave, remote days, expenses and equipment — approve or delegate in a
          click. Policies decide routing, so nothing slips through the cracks.
        </p>
        <div className="mt-1 flex flex-col gap-3.5">
          {checks.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground">
                <Check className="size-3.5 text-background" strokeWidth={2} aria-hidden="true" />
              </div>
              <span className="font-sans text-sm font-medium leading-normal text-muted-foreground">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
