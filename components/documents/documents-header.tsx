"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

type DocumentsHeaderProps = {
  onNewDocument?: () => void
}

export function DocumentsHeader({ onNewDocument }: DocumentsHeaderProps) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">Documents</h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          Generate, issue and download HR letters — appointments, offers,
          certificates and more
        </p>
      </div>
      {onNewDocument ? (
        <Button size="lg" onClick={onNewDocument}>
          <Plus className="size-4" strokeWidth={2} />
          New document
        </Button>
      ) : null}
    </div>
  )
}
