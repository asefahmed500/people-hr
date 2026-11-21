import { Download, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

type OnboardingHeaderProps = {
  onExport?: () => void
  onAddNewHire?: () => void
}

export function OnboardingHeader({ onExport, onAddNewHire }: OnboardingHeaderProps) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Onboarding
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          Track new hire progress across onboarding phases
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <Button type="button" variant="outline" onClick={onExport} className="h-9 px-4">
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </Button>
        {onAddNewHire ? (
          <Button type="button" variant="secondary" onClick={onAddNewHire} className="h-9 px-4">
            <Plus className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
            <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              Add new hire
            </span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
