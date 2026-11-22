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
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  submittingLabel?: string
  cancelLabel?: string
  destructive?: boolean
  submitting?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  submittingLabel = "Working…",
  cancelLabel = "Cancel",
  destructive = false,
  submitting = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl border border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2.5 sm:gap-2.5">
          <AlertDialogCancel
            disabled={submitting}
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "min-w-[104px]")}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            aria-busy={submitting || undefined}
            data-loading={submitting ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault()
              if (submitting) return
              onConfirm()
            }}
            className={cn(
              buttonVariants({ variant: destructive ? "destructive" : "default", size: "default" }),
              "min-w-[124px]",
            )}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2" aria-live="polite">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                <span className="button-label-in">{submittingLabel}</span>
              </span>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
