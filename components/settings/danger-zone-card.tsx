"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DangerZoneCard({
  onDeactivate,
  submitting,
}: {
  onDeactivate: () => void
  submitting?: boolean
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-muted p-6">
      <h2 className="mx-0 mb-3 mt-0 font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
        Danger zone
      </h2>
      <div className="flex h-fit items-center justify-between">
        <div className="flex flex-col gap-[3px]">
          <span className="font-sans inline-block text-[13.5px] font-medium leading-normal text-foreground">
            Deactivate account
          </span>
          <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
            Temporarily disable your account. You can reactivate at any time.
          </span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="mx-0 my-0 ml-6 flex shrink-0 items-center rounded-lg border border-border bg-card px-3.5 py-2"
            >
              <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
                Deactivate
              </span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate your account. You can reactivate at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  // Keep the dialog open while the request is in flight and
                  // block double clicks — this is a destructive endpoint.
                  e.preventDefault()
                  if (!submitting) onDeactivate()
                }}
                disabled={submitting}
              >
                {submitting ? "Deactivating…" : "Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
