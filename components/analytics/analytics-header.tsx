import { ChevronDown, Download, Plus } from "lucide-react"

export function AnalyticsHeader() {
  return (
    <div className="flex w-full items-center justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans inline-block text-[28px] font-semibold leading-tight text-[#1f2a26]">
          Analytics
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-[#8a948d]">
          Workforce metrics and trends · Trailing 12 months
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[#e8ebe6] bg-white px-3 py-2"
        >
          <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
            Last 30 days
          </span>
          <ChevronDown className="size-3.5 text-[#8a948d]" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-[#2f6f61] px-3.5 py-2"
        >
          <Plus className="size-3.5 text-white" strokeWidth={2} />
          <span className="font-sans text-[13px] font-semibold leading-normal text-white">
            Export
          </span>
        </button>
      </div>
    </div>
  )
}
