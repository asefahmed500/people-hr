"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel?: string
  submitVariant?: "default" | "destructive"
  submitting?: boolean
  onSubmit: () => void
  children: React.ReactNode
}

export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "Save",
  submitVariant = "default",
  submitting = false,
  onSubmit,
  children,
}: ActionDialogProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitting) {
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag !== "TEXTAREA" && tag !== "BUTTON" && tag !== "SELECT") {
        e.preventDefault()
        onSubmit()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={handleKeyDown}
        className="max-w-[480px] gap-5 rounded-2xl border border-border bg-card p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-h4">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="font-sans text-[12.5px] text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="flex flex-col gap-3.5">{children}</div>
        <DialogFooter className="gap-2.5 sm:gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-card font-sans text-[13.5px] font-medium text-secondary-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            variant={submitVariant}
            className={submitVariant === "default" ? "font-sans text-[13.5px] font-medium" : "inline-flex items-center gap-1.5 rounded-lg bg-foreground font-sans text-[13.5px] font-medium text-background hover:bg-foreground/90 disabled:opacity-60"}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
