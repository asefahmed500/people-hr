// File attachments stored inline on module documents (no file server needed).
// Kept small: a data URL + metadata. Suitable for identity docs, certificates,
// contracts and supporting evidence in HR workflows.

export type Attachment = {
  id: string
  name: string
  type: string
  size: number
  /** data:<mime>;base64,<payload> — sanitized and size-limited before storage. */
  dataUrl: string
  kind: "identity" | "contract" | "certificate" | "supporting" | "other"
  required: boolean
  uploadedAt: string
  uploadedBy?: string
}

export const ATTACHMENT_KINDS: Array<{ value: Attachment["kind"]; label: string }> = [
  { value: "identity", label: "Identity document" },
  { value: "contract", label: "Contract" },
  { value: "certificate", label: "Certificate" },
  { value: "supporting", label: "Supporting document" },
  { value: "other", label: "Other" },
]

export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
export const MAX_ATTACHMENTS = 10

export function attachmentError(
  file: { name: string; type: string; size: number },
  existing: Array<{ name: string; size: number }>,
): string | null {
  if (!(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: unsupported file type. Use PDF, JPG, PNG, WEBP or DOCX.`
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — over the ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB limit.`
  }
  if (existing.some((f) => f.name === file.name && f.size === file.size)) {
    return `${file.name} has already been attached.`
  }
  return null
}

export function readAttachment(file: File, kind: Attachment["kind"], required: boolean, uploadedBy?: string): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}.`))
    reader.onload = () => {
      resolve({
        id: `att-${crypto.randomUUID()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: String(reader.result),
        kind,
        required,
        uploadedAt: new Date().toISOString(),
        uploadedBy,
      })
    }
    reader.readAsDataURL(file)
  })
}
