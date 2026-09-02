"use client"

import * as React from "react"
import { Download } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { printDocument } from "@/lib/print-document"
import { sanitizeLetterHtml } from "@/lib/sanitize-html"
import { DOCUMENT_TYPE_LABELS, type HRDocument } from "@/lib/data/documents"
import { notify } from "@/lib/toast"

type LetterPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: HRDocument | null
}

export function LetterPreview({ open, onOpenChange, document: doc }: LetterPreviewProps) {
  if (!doc) return null

  function handleDownloadPdf() {
    const ok = printDocument(doc!.refNo, sanitizeLetterHtml(doc!.body))
    if (ok) {
      notify.success("PDF ready", "Use your browser's “Save as PDF” to download.")
    } else {
      notify.error("Couldn't open print view", "Allow pop-ups for this site and try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] gap-4 rounded-2xl border border-border bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-h4">{DOCUMENT_TYPE_LABELS[doc.type]} — {doc.employeeName}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border bg-white px-10 py-8 shadow-inner dark:bg-[#fdfdfc]">
          <div
            className="letter-editor-body text-[13px] leading-relaxed text-[#111] [&_em]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: sanitizeLetterHtml(doc.body) }}
          />
        </div>
        <DialogFooter className="gap-2.5 sm:gap-2.5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownloadPdf}>
            <Download className="size-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
