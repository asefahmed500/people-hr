import { Download, Plus } from "lucide-react"

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
        <button
          type="button"
          onClick={onExport}
          className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </button>
        {onAddNewHire ? (
          <button
            type="button"
            onClick={onAddNewHire}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-gradient-to-b from-white to-[#ececea] shadow-xs transition-colors hover:to-[#e2e2df]"
          >
            <Plus className="size-4 text-secondary-foreground" strokeWidth={2} />
            <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              Add new hire
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
