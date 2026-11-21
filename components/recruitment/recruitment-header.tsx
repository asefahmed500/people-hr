import { Plus, UserPlus } from "lucide-react"

import { FilterButton, type FilterOption } from "@/components/shared/filter-button"
import { ExportButton } from "@/components/shared/export-button"
import { Button } from "@/components/ui/button"

export function RecruitmentHeader({
  onPostClick,
  onAddCandidate,
  roleFilter,
  onRoleFilterChange,
  roleOptions,
  onExport,
}: {
  onPostClick?: () => void
  onAddCandidate?: () => void
  roleFilter: string
  onRoleFilterChange: (value: string) => void
  roleOptions: FilterOption[]
  onExport: () => void
}) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Recruitment
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          Open roles and active candidates across the pipeline
        </p>
      </div>
      <div className="flex w-full items-center gap-2.5 sm:w-auto">
        <FilterButton
          value={roleFilter}
          onChange={onRoleFilterChange}
          options={roleOptions}
          ariaLabel="Filter by role"
        />
        <ExportButton onClick={onExport} label="Export" />
        <Button type="button" variant="outline" onClick={onAddCandidate} className="h-9 flex-1 px-4 sm:flex-none">
          <UserPlus className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Add candidate
          </span>
        </Button>
        <Button type="button" variant="secondary" onClick={onPostClick} className="h-9 flex-1 px-4 sm:flex-none">
          <Plus className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
            Post a job
          </span>
        </Button>
      </div>
    </div>
  )
}
