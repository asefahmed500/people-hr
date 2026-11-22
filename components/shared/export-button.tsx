"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ExportButtonProps = {
  onClick: () => void
  label?: string
  className?: string
}

export function ExportButton({ onClick, label = "Export", className }: ExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={label}
      className={cn("sm:flex-none", className)}
    >
      <Download className="size-3.5 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
