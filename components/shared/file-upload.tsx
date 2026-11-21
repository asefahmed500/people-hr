"use client"

import * as React from "react"
import { Download, FileText, Paperclip, RotateCcw, Trash2, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ALLOWED_ATTACHMENT_TYPES,
  attachmentError,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  readAttachment,
  type Attachment,
} from "@/lib/data/attachments"

type FileUploadProps = {
  value: Attachment[]
  onChange: (files: Attachment[]) => void
  /** Which document kinds are expected, with whether they are mandatory. */
  requiredKinds?: Array<Attachment["kind"]>
  optionalKinds?: Array<Attachment["kind"]>
  maxFiles?: number
  disabled?: boolean
  label?: string
  error?: string
  uploadedBy?: string
}

export function FileUpload({
  value,
  onChange,
  requiredKinds = [],
  optionalKinds = [],
  maxFiles = MAX_ATTACHMENTS,
  disabled = false,
  label = "Documents",
  error,
  uploadedBy,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [uploading, setUploading] = React.useState<string[]>([])
  const [errors, setErrors] = React.useState<string[]>([])
  const [progress, setProgress] = React.useState<Record<string, number>>({})

  const addFiles = React.useCallback(async (files: File[]) => {
    if (disabled || files.length === 0) return
    const messages: string[] = []
    const accepted: File[] = []
    for (const file of files) {
      const problem = attachmentError(file, value)
      if (problem) messages.push(problem)
      else if (accepted.length + value.length >= maxFiles) messages.push(`Maximum ${maxFiles} files allowed.`)
      else accepted.push(file)
    }
    setErrors(messages)
    if (!accepted.length) return

    setUploading(accepted.map((f) => f.name))
    const results: Attachment[] = []
    for (const file of accepted) {
      try {
        // Report realistic progress while the FileReader decodes the file.
        setProgress((p) => ({ ...p, [file.name]: 10 }))
        const attachment = await readAttachment(
          file,
          requiredKinds[0] ?? optionalKinds[0] ?? "supporting",
          requiredKinds.length > 0,
          uploadedBy,
        )
        setProgress((p) => ({ ...p, [file.name]: 100 }))
        results.push(attachment)
      } catch (e) {
        setErrors((prev) => [...prev, e instanceof Error ? e.message : `Couldn't attach ${file.name}.`])
      }
    }
    onChange([...value, ...results])
    setUploading([])
    setProgress({})
  }, [disabled, value, maxFiles, requiredKinds, optionalKinds, uploadedBy, onChange])

  const remove = (id: string) => onChange(value.filter((f) => f.id !== id))

  const replace = (id: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ALLOWED_ATTACHMENT_TYPES.join(",")
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      void addFiles([file]).then(() => remove(id))
    }
    input.click()
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-h5 text-foreground">{label}</h3>
          <p className="font-sans text-[12px] text-muted-foreground">
            PDF, JPG, PNG, WEBP, DOCX · Max {MAX_ATTACHMENT_BYTES / 1024 / 1024} MB each · up to {maxFiles} files
          </p>
        </div>
        {requiredKinds.length > 0 ? (
          <span className="rounded-md bg-primary px-1.5 py-0.5 font-sans text-[10px] font-semibold text-primary-foreground">
            Required
          </span>
        ) : (
          <span className="rounded-md border border-border bg-card px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
            Optional
          </span>
        )}
      </div>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload documents. Drag files here or press Enter to browse."
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void addFiles(Array.from(e.dataTransfer.files))
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center transition-colors",
          dragging && "border-primary bg-muted",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted",
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="font-sans text-[13px] font-medium text-foreground">Upload documents</span>
        <span className="font-sans text-[12px] text-muted-foreground">or drag files here</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        disabled={disabled}
        accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          void addFiles(Array.from(e.target.files ?? []))
          e.target.value = ""
        }}
      />

      {errors.length > 0 ? (
        <ul className="flex flex-col gap-1" role="alert">
          {errors.map((message, i) => (
            <li key={i} className="font-sans text-[12px] text-destructive">{message}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="font-sans text-[12px] text-destructive">{error}</p> : null}

      {value.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {value.map((file) => {
            const isUploading = uploading.includes(file.name)
            const pct = progress[file.name] ?? 100
            const preview = file.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.dataUrl} alt="" className="size-9 rounded object-cover" />
            ) : (
              <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
            )
            return (
              <li key={file.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">{preview}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-sans text-[12.5px] font-medium text-foreground">{file.name}</span>
                  <span className="font-sans text-[11px] text-muted-foreground">
                    {file.type.split("/")[1]?.toUpperCase() ?? "FILE"} · {(file.size / 1024).toFixed(0)} KB
                    {file.required ? " · Required" : " · Optional"}
                    {isUploading ? ` · ${pct}%` : " · Uploaded"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isUploading ? (
                    <RotateCcw className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Download ${file.name}`} onClick={() => {
                        const a = document.createElement("a"); a.href = file.dataUrl; a.download = file.name; a.click()
                      }}><Download className="size-3.5" aria-hidden="true" /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Replace ${file.name}`} onClick={() => replace(file.id)}><Paperclip className="size-3.5" aria-hidden="true" /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={() => remove(file.id)}><Trash2 className="size-3.5 text-destructive" aria-hidden="true" /></Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
