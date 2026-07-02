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
      className="flex w-full flex-col items-center gap-14 border-y border-[#ece9e2] bg-white px-5 py-[92px] sm:px-10 lg:flex-row lg:items-center lg:px-20"
    >
      <div className="flex w-full shrink-0 justify-center lg:w-[540px]">
        <div className="flex w-full flex-col gap-4 rounded-[18px] border border-[#ece9e2] bg-[#faf9f5] p-5 shadow-[0px_24px_50px_rgba(47,111,97,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#2f6f611a]">
                <Inbox className="size-[18px] text-[#2f6f61]" strokeWidth={2} />
              </div>
              <span className="font-display text-base font-semibold text-[#1f2a26]">
                Approvals inbox
              </span>
            </div>
            <div className="flex h-6 items-center rounded-full bg-[#2f6f61] px-2.5">
              <span className="font-sans text-[11px] font-semibold leading-normal text-white">
                3 new
              </span>
            </div>
          </div>

          {approvals.map((row) => (
            <div
              key={row.initials}
              className="flex items-center gap-3 rounded-xl border border-[#ece9e2] bg-white p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2f6f611a]">
                <span className="font-sans text-xs font-semibold leading-normal text-[#2f6f61]">
                  {row.initials}
                </span>
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-sans text-[13px] font-semibold leading-normal text-[#1f2a26]">
                  {row.name}
                </span>
                <span className="font-sans text-xs leading-normal text-[#8a948d]">
                  {row.detail}
                </span>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#2f6f61]">
                <Check className="size-4 text-white" strokeWidth={2} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[22px]">
        <p className="font-sans text-xs font-semibold uppercase tracking-[1.68px] text-[#2f6f61]">
          One inbox for everything
        </p>
        <h2 className="max-w-[440px] font-display text-[30px] font-semibold leading-[1.12] tracking-[-0.6px] text-[#1f2a26] sm:text-[38px]">
          Every people request, handled in one calm place
        </h2>
        <p className="max-w-[460px] font-sans text-base leading-[1.6] text-[#5b655e]">
          Leave, remote days, expenses and equipment — approve or delegate in a
          click. Policies decide routing, so nothing slips through the cracks.
        </p>
        <div className="mt-1 flex flex-col gap-3.5">
          {checks.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2f6f61]">
                <Check className="size-3.5 text-white" strokeWidth={2} />
              </div>
              <span className="font-sans text-[15px] font-medium leading-normal text-[#42504a]">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
