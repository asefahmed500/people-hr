import { Download, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

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
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className="flex-1 sm:flex-none"
        >
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          Export
        </Button>
        {onAddClick ? (
          <Button
            type="button"
            onClick={onAddClick}
            className="flex-1 sm:flex-none"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Add employee
          </Button>
        ) : null}
      </div>
    </div>
  )
}
