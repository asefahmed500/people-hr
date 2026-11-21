"use client"

import { Button } from "@/components/ui/button"

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
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={disabled && !saving}
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={disabled || saving}
      >
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  )
}
