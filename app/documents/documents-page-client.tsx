"use client"

import * as React from "react"
import { z } from "zod"
import { ArrowLeft, RefreshCw, Save, Send } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DocumentsHeader } from "@/components/documents/documents-header"
import { TemplateGallery } from "@/components/documents/template-gallery"
import { DocumentList } from "@/components/documents/document-list"
import { LetterPreview } from "@/components/documents/letter-preview"
import { RichTextEditor } from "@/components/documents/rich-text-editor"
import { Field, SelectField, useForm } from "@/components/shared/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useApiStore } from "@/hooks/use-api-store"
import { notify } from "@/lib/toast"
import { printDocument } from "@/lib/print-document"
import {
  buildLetterBody,
  defaultDocumentsStore,
  DOCUMENT_TYPE_LABELS,
  nextRefNo,
  type DocumentType,
  type HRDocument,
  type DocumentsStore,
} from "@/lib/data/documents"
import type { Employee } from "@/lib/data/employees"

const composeSchema = z
  .object({
    employeeName: z.string().min(1, "Select an employee"),
    jobTitle: z.string().min(1, "Job title is required"),
    department: z.string().min(1, "Department is required"),
    issueDate: z.string().min(1, "Issue date is required"),
    startDate: z.string(),
    endDate: z.string(),
    monthlySalary: z.string(),
    purpose: z.string(),
    reason: z.string(),
  })
  .superRefine((v, ctx) => {
    const t = composeType
    if (NEEDS_START.has(t) && !v.startDate) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Start date is required" })
    }
    if (NEEDS_END.has(t) && !v.endDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date is required" })
    }
    if (t === "salary-certificate" && !v.monthlySalary) {
      ctx.addIssue({ code: "custom", path: ["monthlySalary"], message: "Monthly salary is required" })
    }
    if (t === "noc" && !v.purpose.trim()) {
      ctx.addIssue({ code: "custom", path: ["purpose"], message: "State the purpose" })
    }
    if (t === "warning" && !v.reason.trim()) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: "Describe the reason" })
    }
    if (v.startDate && v.endDate && v.endDate < v.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date can't be before start date" })
    }
    if (v.issueDate > todayStr()) {
      ctx.addIssue({ code: "custom", path: ["issueDate"], message: "Issue date can't be in the future" })
    }
  })

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

const NEEDS_START = new Set<DocumentType>(["appointment", "offer", "experience", "internship", "appraisal"])
const NEEDS_END = new Set<DocumentType>(["experience", "relieving", "internship"])

// The schema above closes over the currently-composed type; kept in module
// scope and assigned before validation runs.
let composeType: DocumentType = "appointment"

export function DocumentsPageClient() {
  const { state, setState, hydrated } = useApiStore<DocumentsStore>(
    "/api/store/documents",
    () => defaultDocumentsStore,
  )
  const employees = useApiStore<Employee[]>("/api/store/employees", () => [])
  // The real workspace name (admin-set) brands letters + PDF exports.
  const organization = useApiStore<{ companyName?: string }>(
    "/api/store/organization",
    () => ({ companyName: "", departments: [], offices: [], orgChart: [] }),
  )
  const companyName = organization.state.companyName?.trim() ?? ""

  const [mode, setMode] = React.useState<"list" | "compose">("list")
  const [type, setType] = React.useState<DocumentType>("appointment")
  const [body, setBody] = React.useState("")
  const [previewDoc, setPreviewDoc] = React.useState<HRDocument | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<HRDocument | null>(null)

  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), [])
  const form = useForm({
    employeeName: "",
    jobTitle: "",
    department: "",
    issueDate: today,
    // Start date defaults to today — an empty value renders a useless 0/0/0
    // date picker and fails first-submit validation.
    startDate: today,
    endDate: "",
    monthlySalary: "",
    purpose: "",
    reason: "",
  })

  function openCompose(nextType: DocumentType) {
    setType(nextType)
    form.reset({
      employeeName: "",
      jobTitle: "",
      department: "",
      issueDate: today,
      startDate: today,
      endDate: "",
      monthlySalary: "",
      purpose: "",
      reason: "",
    })
    setBody(
      buildLetterBody(nextType, {
        employeeName: "[Employee Name]",
        jobTitle: "[Job Title]",
        department: "[Department]",
        startDate: undefined,
        endDate: undefined,
      }, companyName || undefined),
    )
    setMode("compose")
  }

  function handleEmployeeChange(name: string) {
    const emp = employees.state.find((e) => e.name === name)
    const next = {
      ...form.values,
      employeeName: name,
      jobTitle: emp?.role ?? form.values.jobTitle,
      department: emp?.department ?? form.values.department,
    }
    form.reset(next)
    // Re-run the mail merge immediately: issuing with the untouched template
    // would send the letter out containing literal "[Employee Name]".
    setBody(
      buildLetterBody(type, {
        employeeName: next.employeeName || "[Employee Name]",
        jobTitle: next.jobTitle || "[Job Title]",
        department: next.department || "[Department]",
        startDate: next.startDate || undefined,
        endDate: next.endDate || undefined,
        monthlySalary: next.monthlySalary || undefined,
        purpose: next.purpose || undefined,
        reason: next.reason || undefined,
      }, companyName || undefined),
    )
  }

  /** Re-fill the letter body from the current field values. */
  function regenerate() {
    setBody(
      buildLetterBody(type, {
        employeeName: form.values.employeeName || "[Employee Name]",
        jobTitle: form.values.jobTitle || "[Job Title]",
        department: form.values.department || "[Department]",
        startDate: form.values.startDate || undefined,
        endDate: form.values.endDate || undefined,
        monthlySalary: form.values.monthlySalary || undefined,
        purpose: form.values.purpose || undefined,
        reason: form.values.reason || undefined,
      }, companyName || undefined),
    )
  }

  function validate(): boolean {
    composeType = type
    const parsed = composeSchema.safeParse(form.values)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !errs[key]) errs[key] = issue.message
      }
      form.setErrors(errs)
      return false
    }
    return true
  }

  function save(status: "draft" | "issued") {
    if (!validate()) {
      notify.error("Check the form", "Some fields need attention.")
      return
    }
    if (!state.documents.some((d) => d.body === body) && body.length < 40) {
      notify.error("Letter looks empty", "Write the letter body before saving.")
      return
    }
    const v = form.values
    const doc: HRDocument = {
      id: `doc-${Date.now()}`,
      type,
      title: `${DOCUMENT_TYPE_LABELS[type]} — ${v.employeeName}`,
      refNo: nextRefNo(type, state.documents, new Date().getFullYear(), companyName || undefined),
      status,
      employeeName: v.employeeName,
      department: v.department,
      jobTitle: v.jobTitle,
      issueDate: v.issueDate || today,
      body,
      createdBy: "HR",
      createdAt: Date.now(),
    }
    setState((prev) => ({ ...prev, documents: [doc, ...prev.documents] }))
    if (status === "issued") {
      notify.success("Document issued", `${DOCUMENT_TYPE_LABELS[doc.type]} ${doc.refNo} issued to ${doc.employeeName}.`)
    } else {
      notify.info("Draft saved", `${DOCUMENT_TYPE_LABELS[doc.type]} saved as draft.`)
    }
    setMode("list")
  }

  function handleDownloadPdf(doc: HRDocument) {
    const ok = printDocument(doc.refNo, doc.body, { companyName: companyName || undefined })
    if (ok) {
      notify.success("PDF ready", "Use your browser's “Save as PDF” to download.")
    } else {
      notify.error("Couldn't open print view", "Allow pop-ups for this site and try again.")
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    setState((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== deleteTarget.id),
    }))
    notify.success(`Deleted`, `${deleteTarget.refNo} was removed.`)
    setDeleteTarget(null)
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/documents" current="Documents" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
        <Skeleton className="mt-5 h-[300px] w-full rounded-2xl" />
      </DashboardShell>
    )
  }

  const sorted = [...state.documents].sort((a, b) => b.createdAt - a.createdAt)

  if (mode === "compose") {
    return (
      <>
        <DashboardShell activeHref="/documents" current="Documents" accentCurrent>
          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon-sm" onClick={() => setMode("list")} title="Back">
                  <ArrowLeft className="size-4" />
                </Button>
                <div className="flex flex-col gap-1">
                  <h1 className="text-h2">New {DOCUMENT_TYPE_LABELS[type]}</h1>
                  <p className="font-sans text-[13px] text-muted-foreground">
                    Ref {nextRefNo(type, state.documents)} · fields marked * are required
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" onClick={() => save("draft")}>
                  <Save className="size-4" />
                  Save draft
                </Button>
                <Button onClick={() => save("issued")}>
                  <Send className="size-4" />
                  Issue letter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-3.5 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-3">
              <SelectField
                label="Employee"
                required
                value={form.values.employeeName}
                onChange={handleEmployeeChange}
                error={form.errors.employeeName}
                options={[
                  { value: "", label: "Select an employee…" },
                  ...employees.state.map((e) => ({ value: e.name, label: `${e.name} · ${e.department}` })),
                ]}
              />
              <Field label="Job title" required value={form.values.jobTitle} onChange={(val) => form.setValue("jobTitle", val)} error={form.errors.jobTitle} placeholder="e.g. Backend Engineer" />
              <Field label="Department" required value={form.values.department} onChange={(val) => form.setValue("department", val)} error={form.errors.department} placeholder="e.g. Engineering" />
              <Field label="Issue date" type="date" required value={form.values.issueDate} onChange={(val) => form.setValue("issueDate", val)} error={form.errors.issueDate} />
              {NEEDS_START.has(type) ? (
                <Field label="Effective / start date" type="date" required value={form.values.startDate} onChange={(val) => form.setValue("startDate", val)} error={form.errors.startDate} />
              ) : null}
              {NEEDS_END.has(type) ? (
                <Field label="End / last working day" type="date" required value={form.values.endDate} onChange={(val) => form.setValue("endDate", val)} error={form.errors.endDate} />
              ) : null}
              {["appointment", "offer", "salary-certificate", "appraisal"].includes(type) ? (
                <Field label="Gross monthly salary" value={form.values.monthlySalary} onChange={(val) => form.setValue("monthlySalary", val)} error={form.errors.monthlySalary} placeholder="e.g. USD 6,500" />
              ) : null}
              {type === "noc" ? (
                <Field label="Purpose of NOC" required value={form.values.purpose} onChange={(val) => form.setValue("purpose", val)} error={form.errors.purpose} placeholder="e.g. to apply for a tourist visa" />
              ) : null}
              {type === "warning" ? (
                <Field label="Reason for warning" required value={form.values.reason} onChange={(val) => form.setValue("reason", val)} error={form.errors.reason} placeholder="e.g. repeated late arrivals in July" />
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">Letter body</span>
                <Button variant="outline" size="sm" onClick={regenerate} title="Re-fill from the fields above">
                  <RefreshCw className="size-3.5" />
                  Regenerate template
                </Button>
              </div>
              <RichTextEditor value={body} onChange={setBody} />
            </div>
          </div>
        </DashboardShell>
      </>
    )
  }

  return (
    <>
      <DashboardShell activeHref="/documents" current="Documents" accentCurrent>
        <div className="flex flex-col gap-5">
          <DocumentsHeader onNewDocument={() => openCompose(type)} />
          <TemplateGallery onSelect={openCompose} />
          <div className="flex flex-col gap-3">
            <h2 className="text-h5 font-sans text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
              All documents ({sorted.length})
            </h2>
            <DocumentList
              documents={sorted}
              onPreview={setPreviewDoc}
              onDownloadPdf={handleDownloadPdf}
              onDelete={setDeleteTarget}
            />
          </div>
        </div>
      </DashboardShell>

      <LetterPreview open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)} document={previewDoc} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.refNo ?? ""}?`}
        description="This permanently removes the document. This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
