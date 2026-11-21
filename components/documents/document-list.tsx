"use client"

import { Download, Eye, Trash2, FileSignature } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

const headClass =
  "px-4 py-2.5 font-sans text-[11.5px] font-semibold uppercase tracking-wide text-foreground"

export function DocumentList({ documents, onPreview, onDownloadPdf, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted py-14">
        <FileSignature className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <p className="font-sans text-sm font-medium text-foreground">No documents yet</p>
        <p className="font-sans text-[12.5px] text-muted-foreground">
          Pick a letter type above to generate the first one.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader className="[&_th]:bg-muted [&_th]:hover:bg-muted">
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className={headClass}>Document</TableHead>
            <TableHead className={cn(headClass, "hidden sm:table-cell")}>Employee</TableHead>
            <TableHead className={cn(headClass, "hidden md:table-cell")}>Ref No.</TableHead>
            <TableHead className={cn(headClass, "hidden lg:table-cell")}>Issued</TableHead>
            <TableHead className={headClass}>Status</TableHead>
            <TableHead className={cn(headClass, "text-right")}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <FileSignature className="size-3.5 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="font-sans text-[13px] font-medium leading-snug text-foreground">
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden px-4 py-3 sm:table-cell">
                <span className="font-sans text-[13px] text-foreground">{doc.employeeName}</span>
              </TableCell>
              <TableCell className="hidden px-4 py-3 md:table-cell">
                <span className="font-mono text-[12px] text-muted-foreground">{doc.refNo}</span>
              </TableCell>
              <TableCell className="hidden px-4 py-3 lg:table-cell">
                <span className="font-sans text-[13px] text-secondary-foreground">{fmtDate(doc.issueDate)}</span>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 text-[10px] font-medium",
                    doc.status === "issued"
                      ? "bg-foreground/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {doc.status === "issued" ? "Issued" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-end gap-0.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Preview ${doc.title}`} onClick={() => onPreview(doc)}>
                          <Eye className="size-3.5" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Download ${doc.title} as PDF`} onClick={() => onDownloadPdf(doc)}>
                          <Download className="size-3.5" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download PDF</TooltipContent>
                    </Tooltip>
                    {onDelete ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${doc.title}`} onClick={() => onDelete(doc)}>
                            <Trash2 className="size-3.5 text-destructive" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    ) : null}
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
