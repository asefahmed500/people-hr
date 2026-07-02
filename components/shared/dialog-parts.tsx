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
      if (tag !== "TEXTAREA" && tag !== "BUTTON") {
        e.preventDefault()
        onSubmit()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={handleKeyDown}
        className="max-w-[480px] gap-5 rounded-[18px] border border-[#ece9e2] bg-white p-6"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-[18px] font-semibold text-[#1f2a26]">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="font-sans text-[12.5px] text-[#8a948d]">
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
            className="rounded-lg border border-[#e8ebe6] bg-white font-sans text-[13.5px] font-medium text-[#5b655e] hover:bg-[#faf9f6] disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            variant={submitVariant}
            className={
              submitVariant === "default"
                ? "inline-flex items-center gap-1.5 rounded-lg bg-[#2f6f61] font-sans text-[13.5px] font-semibold text-white hover:bg-[#27614f] disabled:opacity-60"
                : "inline-flex items-center gap-1.5 rounded-lg bg-[#c4553a] font-sans text-[13.5px] font-semibold text-white hover:bg-[#b8462f] disabled:opacity-60"
            }
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
