import { Check, ChevronRight, HelpCircle } from "lucide-react"

const planFeatures = [
  "Unlimited employees",
  "Advanced analytics & reports",
  "Priority support & SLA",
]

const summary = [
  { label: "Member since", value: "Jan 2023" },
  { label: "Role", value: "Admin" },
  { label: "Workspace", value: "Northwind Labs" },
  { label: "Seats", value: "284 / 300" },
]

export function SettingsRightPanel() {
  return (
    <div className="flex w-[320px] shrink-0 flex-col gap-4">
      <div className="flex flex-col gap-3.5 rounded-[14px] border border-[#e8ebe6] bg-white p-5">
        <div className="flex h-fit items-center justify-between">
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-[#1f2a26]">
            Your plan
          </span>
          <span className="flex items-center rounded-full border border-[#c8e5de] bg-[#edf6f3] px-2 py-[3px]">
            <span className="font-sans text-[11px] font-semibold leading-normal text-[#2f6f61]">
              Business
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {planFeatures.map((feature) => (
            <div key={feature} className="flex h-fit items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[#2f6f61]" strokeWidth={2} />
              <span className="font-sans inline-block text-[12.5px] leading-normal text-[#5b655e]">
                {feature}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="flex items-center justify-center rounded-lg border border-[#c8e5de] bg-white px-3.5 py-2"
        >
          <span className="font-sans text-[13px] font-medium leading-normal text-[#2f6f61]">
            Manage plan
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-[14px] border border-[#e8ebe6] bg-white p-5">
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-[#1f2a26]">
          Account summary
        </span>
        <div className="flex flex-col gap-2.5">
          {summary.map((row) => (
            <div key={row.label} className="flex h-fit items-center justify-between">
              <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
                {row.label}
              </span>
              <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-[#1f2a26]">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[14px] border border-[#e8ebe6] bg-white p-5">
        <div className="flex h-fit items-center gap-2">
          <HelpCircle className="size-[15px] shrink-0 text-[#8a948d]" strokeWidth={2} />
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-[#1f2a26]">
            Need help?
          </span>
        </div>
        <button
          type="button"
          className="flex h-fit items-center gap-1.5"
        >
          <span className="font-sans text-[12.5px] font-medium leading-normal text-[#2f6f61]">
            Visit the Help Center
          </span>
          <ChevronRight className="size-3 text-[#2f6f61]" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="flex h-fit items-center gap-1.5"
        >
          <span className="font-sans text-[12.5px] leading-normal text-[#5b655e]">
            Contact support
          </span>
          <ChevronRight className="size-3 text-[#5b655e]" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
