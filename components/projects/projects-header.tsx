import { Plus } from "lucide-react"

import { FilterButton, type FilterOption } from "@/components/shared/filter-button"
import { ExportButton } from "@/components/shared/export-button"
import { Button } from "@/components/ui/button"

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
    <div className="flex w-full items-start justify-between gap-4">
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
          <Button type="button" variant="secondary" onClick={onNewProject} className="h-9 px-4">
            <Plus className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
            <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              New project
            </span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
