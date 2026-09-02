import { Plus } from "lucide-react"

import { FilterButton, type FilterOption } from "@/components/shared/filter-button"
import { ExportButton } from "@/components/shared/export-button"

export function ProjectsHeader({
  onNewProject,
  deptFilter,
  onDeptFilterChange,
  deptOptions,
  onExport,
  subtitle,
}: {
  onNewProject?: () => void
  deptFilter: string
  onDeptFilterChange: (value: string) => void
  deptOptions: FilterOption[]
  onExport: () => void
  subtitle?: string
}) {
  return (
    <div className="flex w-full items-start justify-between gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Projects
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          {subtitle ?? "Active projects across your teams"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <FilterButton
          value={deptFilter}
          onChange={onDeptFilterChange}
          options={deptOptions}
          ariaLabel="Filter by department"
        />
        <ExportButton onClick={onExport} label="Export" />
        {onNewProject ? (
          <button
            type="button"
            onClick={onNewProject}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-gradient-to-b from-white to-[#ececea] shadow-xs transition-colors hover:to-[#e2e2df]"
          >
            <Plus className="size-4 text-secondary-foreground" strokeWidth={2} />
            <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              New project
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
