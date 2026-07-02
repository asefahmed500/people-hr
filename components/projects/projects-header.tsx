import { ChevronDown, Download, Plus } from "lucide-react"

import { notify } from "@/lib/toast"

export function ProjectsHeader({
  onFilter,
  onExport,
  onNewProject,
}: {
  onFilter?: () => void
  onExport?: () => void
  onNewProject?: () => void
}) {
  return (
    <div className="flex w-full items-start justify-between gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display inline-block text-[28px] font-semibold leading-tight text-[#1f2a26]">
          Projects
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-[#6b7770]">
          Tuesday, 18 February 2025 · 24 active projects across 6 teams · 4
          flagged at risk
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onFilter ?? (() => notify.info("Filter projects"))}
          className="flex h-10 items-center gap-2 rounded-[11px] border border-[#e3ded4] bg-white px-4"
        >
          <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
            All projects
          </span>
          <ChevronDown
            className="size-[15px] rotate-90 text-[#8a948d]"
            strokeWidth={2}
          />
        </button>
        <button
          type="button"
          onClick={onExport ?? (() => notify.success("Projects exported"))}
          className="flex h-10 items-center gap-2 rounded-[11px] border border-[#e3ded4] bg-white px-4"
        >
          <Download className="size-4 text-[#5b655e]" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
            Export
          </span>
        </button>
        <button
          type="button"
          onClick={onNewProject}
          className="flex h-10 items-center gap-2 rounded-[11px] bg-[#2f6fd0] px-4 shadow-[0px_6px_16px_rgba(47,111,208,0.2)]"
        >
          <Plus className="size-4 text-white" strokeWidth={2} />
          <span className="font-sans text-[13px] font-semibold leading-normal text-white">
            New project
          </span>
        </button>
      </div>
    </div>
  )
}
