"use client"

import { notify } from "@/lib/toast"
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
}: {
  onDeactivate: () => void
}) {
  return (
    <div className="flex flex-col rounded-[14px] border border-[#e7c4bb] bg-[#fbf3f1] p-6">
      <h2 className="mx-0 mb-3 mt-0 font-sans inline-block text-[15px] font-semibold leading-normal text-[#c4553a]">
        Danger zone
      </h2>
      <div className="flex h-fit items-center justify-between">
        <div className="flex flex-col gap-[3px]">
          <span className="font-sans inline-block text-[13.5px] font-medium leading-normal text-[#1f2a26]">
            Deactivate account
          </span>
          <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
            Temporarily disable your account. You can reactivate at any time.
          </span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="mx-0 my-0 ml-6 flex shrink-0 items-center rounded-lg border border-[#e7c4bb] bg-white px-3.5 py-2"
            >
              <span className="font-sans text-[13px] font-medium leading-normal text-[#c4553a]">
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDeactivate()
                  notify.info("Account deactivated", "Your account has been deactivated.")
                }}
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
