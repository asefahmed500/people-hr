"use client"

import { Download } from "lucide-react"

import { cn } from "@/lib/utils"

type ExportButtonProps = {
  onClick: () => void
  label?: string
  className?: string
}

export function ExportButton({ onClick, label = "Export", className }: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted sm:flex-none",
        className,
      )}
    >
      <Download className="size-4 text-secondary-foreground" strokeWidth={2} />
      <span className="hidden sm:inline font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
        {label}
      </span>
    </button>
  )
}
