import { Download, Plus } from "lucide-react"

export function DirectoryHeader() {
  return (
    <div className="flex h-fit w-full shrink-0 items-end justify-between gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display inline-block text-3xl font-semibold leading-[1.1] tracking-[-0.5px] text-[#1f2a26]">
          Employees
        </h1>
        <p className="font-sans inline-block text-sm leading-normal text-[#6b7770]">
          1,284 people across 14 departments · 12 locations
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="flex h-[42px] items-center gap-2 rounded-xl border border-[#e7e4dd] bg-white px-4 shadow-sm"
        >
          <Download className="size-[17px] text-[#5b655e]" strokeWidth={2} />
          <span className="font-sans text-[13.5px] font-medium leading-normal text-[#42504a]">
            Export
          </span>
        </button>
        <button
          type="button"
          className="flex h-[42px] items-center gap-2 rounded-xl bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(62,_128,_115)_100%)] px-4 shadow-[0px_6px_16px_rgba(47,111,97,0.25)]"
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
