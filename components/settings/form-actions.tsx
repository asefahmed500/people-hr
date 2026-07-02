"use client"

export function FormActions({
  onSave,
  onCancel,
}: {
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex h-fit justify-end gap-2.5 px-0 pb-1 pt-0">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center rounded-lg border border-[#e8ebe6] bg-white px-4 py-[9px]"
      >
        <span className="font-sans text-[13.5px] font-medium leading-normal text-[#5b655e]">
          Cancel
        </span>
      </button>
      <button
        type="button"
        onClick={onSave}
        className="flex items-center rounded-lg bg-[#2f6f61] px-4 py-[9px]"
      >
        <span className="font-sans text-[13.5px] font-semibold leading-normal text-white">
          Save changes
        </span>
      </button>
    </div>
  )
}
