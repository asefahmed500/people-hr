import { Download, Plus } from "lucide-react"

import { notify } from "@/lib/toast"

export function DirectoryHeader({ onAddClick }: { onAddClick?: () => void }) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display inline-block text-3xl font-semibold leading-[1.1] tracking-[-0.5px] text-[#1f2a26] sm:text-[28px]">
          Employees
        </h1>
        <p className="font-sans inline-block text-sm leading-normal text-[#6b7770]">
          1,284 people across 14 departments · 12 locations
        </p>
      </div>
      <div className="flex w-full items-center gap-2.5 sm:w-auto">
        <button
          type="button"
          onClick={() => notify.success("Directory exported", "CSV downloaded to your device.")}
          className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#e7e4dd] bg-white px-4 shadow-sm sm:flex-none"
        >
          <Download className="size-[17px] text-[#5b655e]" strokeWidth={2} />
          <span className="font-sans text-[13.5px] font-medium leading-normal text-[#42504a]">
            Export
          </span>
        </button>
        <button
          type="button"
          onClick={onAddClick}
          className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(62,_128,_115)_100%)] px-4 shadow-[0px_6px_16px_rgba(47,111,97,0.25)] sm:flex-none"
        >
          <Plus className="size-[17px] text-white" strokeWidth={2} />
          <span className="font-sans text-[13.5px] font-semibold leading-normal text-white">
            Add employee
          </span>
        </button>
      </div>
    </div>
  )
}
