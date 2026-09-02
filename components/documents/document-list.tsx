"use client"

import { Download, Eye, Trash2, FileSignature } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DOCUMENT_TYPE_LABELS,
  type HRDocument,
} from "@/lib/data/documents"

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

type DocumentListProps = {
  documents: HRDocument[]
  onPreview: (doc: HRDocument) => void
  onDownloadPdf: (doc: HRDocument) => void
  onDelete?: (doc: HRDocument) => void
}

export function DocumentList({ documents, onPreview, onDownloadPdf, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-14">
        <FileSignature className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="font-sans text-sm font-medium text-foreground">No documents yet</p>
        <p className="font-sans text-[12.5px] text-muted-foreground">
          Pick a letter type above to generate the first one.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-[#fafaf8]">
            <th className="px-4 py-2.5 text-left font-sans text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">Document</th>
            <th className="hidden px-4 py-2.5 text-left font-sans text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">Employee</th>
            <th className="hidden px-4 py-2.5 text-left font-sans text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground md:table-cell">Ref No.</th>
            <th className="hidden px-4 py-2.5 text-left font-sans text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">Issued</th>
            <th className="px-4 py-2.5 text-left font-sans text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">Status</th>
            <th className="px-4 py-2.5 text-right font-sans text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-border/60 last:border-b-0 hover:bg-muted/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-gradient-to-b from-white to-[#ececea] dark:from-[#262626] dark:to-[#1c1c1c]">
                    <FileSignature className="size-3.5 text-secondary-foreground" strokeWidth={2} />
                  </span>
                  <span className="font-sans text-[13px] font-medium leading-snug text-foreground">
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                </div>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <span className="font-sans text-[13px] text-foreground">{doc.employeeName}</span>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <span className="font-mono text-[12px] text-muted-foreground">{doc.refNo}</span>
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <span className="font-sans text-[13px] text-secondary-foreground">{fmtDate(doc.issueDate)}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 font-sans text-[11px] font-medium",
                    doc.status === "issued"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  )}
                >
                  {doc.status === "issued" ? "Issued" : "Draft"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-0.5">
                  <Button variant="ghost" size="icon-sm" title="Preview" aria-label={`Preview ${doc.title}`} onClick={() => onPreview(doc)}>
                    <Eye className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="Download PDF" aria-label={`Download ${doc.title} as PDF`} onClick={() => onDownloadPdf(doc)}>
                    <Download className="size-3.5" />
                  </Button>
                  {onDelete ? (
                    <Button variant="ghost" size="icon-sm" title="Delete" aria-label={`Delete ${doc.title}`} onClick={() => onDelete(doc)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
