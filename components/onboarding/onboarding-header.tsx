import { ChevronDown, Download, Plus } from "lucide-react"

type OnboardingHeaderProps = {
  onThisMonth?: () => void
  onExport?: () => void
  onAddNewHire?: () => void
}

export function OnboardingHeader({ onThisMonth, onExport, onAddNewHire }: OnboardingHeaderProps) {
  return (
    <div className="flex w-full items-start justify-between gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display inline-block text-[28px] font-semibold leading-tight text-[#1f2a26]">
          Onboarding
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-[#6b7770]">
          Tuesday, 18 February 2025 · 34 new hires onboarding across 6
          departments
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onThisMonth}
          className="flex h-10 items-center gap-2 rounded-[11px] border border-[#e3ded4] bg-white px-4"
        >
          <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
            This month
          </span>
          <ChevronDown
            className="size-[15px] rotate-90 text-[#8a948d]"
            strokeWidth={2}
          />
        </button>
        <button
          type="button"
          onClick={onExport}
          className="flex h-10 items-center gap-2 rounded-[11px] border border-[#e3ded4] bg-white px-4"
        >
          <Download className="size-4 text-[#5b655e]" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
            Export
          </span>
        </button>
        <button
          type="button"
          onClick={onAddNewHire}
          className="flex h-10 items-center gap-2 rounded-[11px] bg-[#0f9b8e] px-4 shadow-[0px_6px_16px_rgba(15,155,142,0.24)]"
        >
          <Plus className="size-4 text-white" strokeWidth={2} />
          <span className="font-sans text-[13px] font-semibold leading-normal text-white">
            Add new hire
          </span>
        </button>
      </div>
    </div>
  )
}
