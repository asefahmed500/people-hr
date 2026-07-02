import { Download, Play } from "lucide-react"

export function PayrollHeader({
  onExport,
  onRunPayroll,
}: {
  onExport?: () => void
  onRunPayroll?: () => void
}) {
  return (
    <div className="flex w-full items-start justify-between gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display inline-block text-[28px] font-semibold leading-tight text-[#1f2a26]">
          Payroll
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-[#6b7770]">
          February 2025 pay run · 284 employees · Pay date 28 Feb
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onExport}
          className="flex h-10 items-center gap-2 rounded-[11px] border border-[#e3ded4] bg-white px-4"
        >
          <Download className="size-4 text-[#5b655e]" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
            Export report
          </span>
        </button>
        <button
          type="button"
          onClick={onRunPayroll}
          className="flex h-10 items-center gap-2 rounded-[11px] bg-[#2f6f61] px-4 shadow-[0px_6px_16px_rgba(47,111,97,0.24)]"
        >
          <Play className="size-4 text-white" strokeWidth={2} />
          <span className="font-sans text-[13px] font-semibold leading-normal text-white">
            Run payroll
          </span>
        </button>
      </div>
    </div>
  )
}
