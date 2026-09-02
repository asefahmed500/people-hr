import { Download, Plus } from "lucide-react"

export function OrgHeader({
  deptCount,
  peopleCount,
  onExport,
  onNewDept,
}: {
  deptCount?: number
  peopleCount?: number
  onExport?: () => void
  onNewDept?: () => void
}) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Organization
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          Company structure, departments &amp; leadership
          {peopleCount != null && deptCount != null ? ` · ${peopleCount} people across ${deptCount} departments` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onExport}
          className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4"
        >
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </button>
        <button
          type="button"
          onClick={onNewDept}
          className="flex h-10 items-center gap-2 rounded-lg border border-border bg-gradient-to-b from-white to-[#ececea] shadow-xs transition-colors hover:to-[#e2e2df]"
        >
          <Plus className="size-4 text-secondary-foreground" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            New department
          </span>
        </button>
      </div>
    </div>
  )
}
