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
          className="h-[42px] flex-1 px-4 sm:flex-none"
        >
          <Download className="size-[17px] text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans text-[13.5px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </Button>
        {onAddClick ? (
          <Button
            type="button"
            onClick={onAddClick}
            className="h-[42px] flex-1 px-4 sm:flex-none"
          >
            <Plus className="size-[17px]" strokeWidth={2} aria-hidden="true" />
            <span className="font-sans text-[13.5px] font-medium leading-normal">
              Add employee
            </span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
