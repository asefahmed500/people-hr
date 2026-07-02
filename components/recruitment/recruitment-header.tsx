import { ChevronDown, Download, Plus } from "lucide-react"

import { notify } from "@/lib/toast"

export function RecruitmentHeader({
  onPostClick,
  onFilterRoles,
}: {
  onPostClick?: () => void
  onFilterRoles?: () => void
}) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display inline-block text-[28px] font-semibold leading-tight text-[#1f2a26]">
          Recruitment
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-[#6b7770]">
          Tuesday, 18 February 2025 · Open roles and active candidates across the
          pipeline
        </p>
      </div>
      <div className="flex w-full items-center gap-2.5 sm:w-auto">
        <button
          type="button"
          onClick={onFilterRoles ?? (() => notify.info("Filter roles"))}
          className="flex h-10 flex-1 items-center gap-2 rounded-[11px] border border-[#e3ded4] bg-white px-4 sm:flex-none"
        >
          <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
            All roles
          </span>
          <ChevronDown className="size-[15px] rotate-90 text-[#8a948d]" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => notify.success("Pipeline exported", "CSV downloaded.")}
          className="flex h-10 items-center justify-center gap-2 rounded-[11px] border border-[#e3ded4] bg-white px-4 sm:flex-none"
        >
          <Download className="size-4 text-[#5b655e]" strokeWidth={2} />
          <span className="hidden sm:inline font-sans text-[13px] font-medium leading-normal text-[#42504a]">
            Export
          </span>
        </button>
        <button
          type="button"
          onClick={onPostClick}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#e0663d] px-4 shadow-[0px_6px_16px_rgba(224,102,61,0.24)] sm:flex-none"
        >
          <Plus className="size-4 text-white" strokeWidth={2} />
          <span className="font-sans text-[13px] font-semibold leading-normal text-white">
            Post a job
          </span>
        </button>
      </div>
    </div>
  )
}
