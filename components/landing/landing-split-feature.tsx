import { Check, Inbox } from "lucide-react"

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
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-background p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-foreground/10">
                <Inbox className="size-[18px] text-primary" strokeWidth={2} />
              </div>
              <span className="text-h4">
                Approvals inbox
              </span>
            </div>
            <div className="flex h-6 items-center rounded-full bg-primary px-2.5">
              <span className="font-sans text-[11px] font-semibold leading-normal text-primary-foreground">
                3 new
              </span>
            </div>
          </div>

          {approvals.map((row) => (
            <div
              key={row.initials}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                <span className="font-sans text-xs font-semibold leading-normal text-primary">
                  {row.initials}
                </span>
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-sans text-[13px] font-semibold leading-normal text-foreground">
                  {row.name}
                </span>
                <span className="font-sans text-xs leading-normal text-muted-foreground">
                  {row.detail}
                </span>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Check className="size-4 text-primary-foreground" strokeWidth={2} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[22px]">
        <p className="font-sans text-xs font-semibold uppercase tracking-[1.68px] text-primary">
          One inbox for everything
        </p>
        <h2 className="max-w-[440px] text-[30px] font-semibold leading-[1.12] tracking-[-0.01em] text-foreground sm:text-[38px]">
          Every people request, handled in one calm place
        </h2>
        <p className="max-w-[460px] font-sans text-base leading-[1.6] text-secondary-foreground">
          Leave, remote days, expenses and equipment — approve or delegate in a
          click. Policies decide routing, so nothing slips through the cracks.
        </p>
        <div className="mt-1 flex flex-col gap-3.5">
          {checks.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
                <Check className="size-3.5 text-primary-foreground" strokeWidth={2} />
              </div>
              <span className="font-sans text-[15px] font-medium leading-normal text-secondary-foreground">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
