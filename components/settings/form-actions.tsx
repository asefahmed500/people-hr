"use client"

export function FormActions({
  onSave,
  onCancel,
  saving = false,
  disabled = false,
}: {
  onSave: () => void
  onCancel: () => void
  saving?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex h-fit justify-end gap-2.5 px-0 pb-1 pt-0">
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled && !saving}
        className="flex items-center rounded-lg border border-border bg-card px-4 py-[9px] transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
      >
        <span className="font-sans text-[13.5px] font-medium leading-normal text-secondary-foreground">
          Cancel
        </span>
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={disabled || saving}
        className="flex items-center rounded-lg border border-border bg-gradient-to-b from-white to-[#ececea] px-4 py-[9px] shadow-xs transition-colors hover:to-[#e2e2df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
      >
        <span className="font-sans text-[13.5px] font-medium leading-normal text-foreground">
          {saving ? "Saving…" : "Save changes"}
        </span>
      </button>
    </div>
  )
}
