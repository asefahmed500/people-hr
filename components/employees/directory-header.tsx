import { Download, Plus } from "lucide-react"

export function DirectoryHeader({ onAddClick, onExport }: { onAddClick?: () => void; onExport?: () => void }) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Employees
        </h1>
        <p className="font-sans inline-block text-sm leading-normal text-secondary-foreground">
          Your people directory
        </p>
      </div>
      <div className="flex w-full items-center gap-2.5 sm:w-auto">
        <button
          type="button"
          onClick={onExport}
          className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 shadow-sm transition-colors hover:bg-muted sm:flex-none"
        >
          <Download className="size-[17px] text-secondary-foreground" strokeWidth={2} />
          <span className="font-sans text-[13.5px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </button>
        {onAddClick ? (
          <button
            type="button"
            onClick={onAddClick}
            className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-4 shadow-card sm:flex-none"
          >
            <Plus className="size-[17px] text-background" strokeWidth={2} />
            <span className="font-sans text-[13.5px] font-medium leading-normal text-background">
              Add employee
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
