// HR document/letter generation: types, the template catalog, and the
// server-safe letter builder that turns employee + field data into a full
// printable letter. Shared by the client (compose preview) and any server use.

export const DOCUMENT_TYPES = [
  "appointment",
  "offer",
  "experience",
  "relieving",
  "internship",
  "salary-certificate",
  "employment-verification",
  "noc",
  "warning",
  "appraisal",
] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export type HRDocument = {
  id: string
  type: DocumentType
  title: string
  refNo: string
  status: "draft" | "issued"
  employeeName: string
  department: string
  jobTitle: string
  issueDate: string // ISO date
  body: string // sanitized rich-text HTML
  createdBy: string
  createdAt: number
}

export type DocumentsStore = { documents: HRDocument[] }

export const defaultDocumentsStore: DocumentsStore = { documents: [] }

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  appointment: "Appointment Letter",
  offer: "Offer Letter",
  experience: "Experience Letter",
  relieving: "Relieving Letter",
  internship: "Internship Completion",
  "salary-certificate": "Salary Certificate",
  "employment-verification": "Employment Verification",
  noc: "No Objection Certificate",
  warning: "Warning Letter",
  appraisal: "Appraisal Letter",
}

const REF_PREFIXES: Record<DocumentType, string> = {
  appointment: "APT",
  offer: "OFR",
  experience: "EXP",
  relieving: "RLV",
  internship: "INT",
  "salary-certificate": "SAL",
  "employment-verification": "VER",
  noc: "NOC",
  warning: "WRN",
  appraisal: "APR",
}

/** Short uppercase code from the company name for reference numbers. */
export function companyRefCode(company?: string): string {
  const words = (company ?? "").trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "CO"
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase()
}

/** Next reference number for a type, e.g. NW/APT/2026/0003 */
export function nextRefNo(
  type: DocumentType,
  existing: HRDocument[],
  year = new Date().getFullYear(),
  company?: string,
): string {
  const code = companyRefCode(company)
  const prefix = `${REF_PREFIXES[type]}/${year}`
  const max = existing.reduce((acc, d) => {
    if (d.type !== type) return acc
    const parts = d.refNo.split("/")
    if (parts.length < 4 || parts[1] !== REF_PREFIXES[type]) return acc
    const n = Number(parts[3])
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `${code}/${prefix}/${String(max + 1).padStart(4, "0")}`
}

type LetterCtx = {
  companyName?: string
  employeeName: string
  department: string
  jobTitle: string
  startDate?: string
  endDate?: string
  monthlySalary?: string
  purpose?: string
  reason?: string
}

function fmtDate(iso?: string): string {
  if (!iso) return "____________"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function letterShell(ctx: LetterCtx, subject: string, paragraphs: string[]): string {
  const company = esc(ctx.companyName || "Your Company")
  const today = fmtDate(new Date().toISOString())
  return [
    `<p style="text-align:right"><em>Date: ${today}</em></p>`,
    `<p><strong>To,</strong><br>${esc(ctx.employeeName)}<br>${esc(ctx.jobTitle)}, ${esc(ctx.department)}</p>`,
    `<p><strong>Subject:</strong> ${esc(subject)}</p>`,
    ...paragraphs,
    `<p>Sincerely,<br><br><strong>Human Resources</strong><br>${company}</p>`,
  ].join("\n")
}

/**
 * Builds the initial editable body HTML for a letter type.
 * All interpolations are escaped; the result is trusted only because every
 * dynamic value passes through `esc`.
 */
export function buildLetterBody(
  type: DocumentType,
  ctx: LetterCtx,
  company = "Your Company",
): string {
  const c: LetterCtx = { ...ctx, companyName: company }
  const name = esc(c.employeeName)

  switch (type) {
    case "appointment":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>Dear ${name},</p>`,
        `<p>We are pleased to appoint you as <strong>${esc(c.jobTitle)}</strong> in the <strong>${esc(c.department)}</strong> department at ${esc(company)}, effective <strong>${fmtDate(c.startDate)}</strong>.</p>`,
        `<p>Your compensation will be <strong>${esc(c.monthlySalary || "as discussed")}</strong> per month, subject to applicable deductions and company policy. You will report to your department head and be governed by the company's rules, regulations, and code of conduct in force from time to time.</p>`,
        `<p>We look forward to a long and productive association. Please sign a copy of this letter as acceptance of the appointment.</p>`,
      ])
    case "offer":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>Dear ${name},</p>`,
        `<p>Following our discussions, we are delighted to offer you the position of <strong>${esc(c.jobTitle)}</strong> in the <strong>${esc(c.department)}</strong> department at ${esc(company)}.</p>`,
        `<p>Your proposed start date is <strong>${fmtDate(c.startDate)}</strong>, with a monthly compensation of <strong>${esc(c.monthlySalary || "as discussed")}</strong>. This offer remains open for acceptance for seven (7) business days from the date of this letter.</p>`,
        `<p>To accept, please reply to this letter and complete the onboarding formalities shared by the People team.</p>`,
      ])
    case "experience":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>To Whom It May Concern,</p>`,
        `<p>This is to certify that <strong>${name}</strong> served ${esc(company)} as <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department from <strong>${fmtDate(c.startDate)}</strong> to <strong>${fmtDate(c.endDate)}</strong>.</p>`,
        `<p>During their tenure, we found them sincere, dedicated, and professional in their duties. This certificate is issued upon their request and does not create any further obligation on the company.</p>`,
        `<p>We wish them success in future endeavours.</p>`,
      ])
    case "relieving":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>Dear ${name},</p>`,
        `<p>This letter confirms your resignation from ${esc(company)}, where you served as <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department. Your last working day was <strong>${fmtDate(c.endDate)}</strong>.</p>`,
        `<p>You have been relieved of all duties and responsibilities with effect from your last working day, and your full-and-final settlement will be processed per company policy.</p>`,
        `<p>We thank you for your contributions and wish you well.</p>`,
      ])
    case "internship":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>To Whom It May Concern,</p>`,
        `<p>This is to certify that <strong>${name}</strong> completed an internship with the ${esc(c.department)} department at ${esc(company)} from <strong>${fmtDate(c.startDate)}</strong> to <strong>${fmtDate(c.endDate)}</strong>.</p>`,
        `<p>During the internship they demonstrated strong ownership and a keen willingness to learn. Their conduct remained professional throughout.</p>`,
        `<p>We wish them the very best ahead.</p>`,
      ])
    case "salary-certificate":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>To Whom It May Concern,</p>`,
        `<p>This is to certify that <strong>${name}</strong> is employed with ${esc(company)} as <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department.</p>`,
        `<p>Their current gross monthly salary is <strong>${esc(c.monthlySalary || "____________")}</strong>, paid through the company payroll. This certificate is issued for record purposes at the employee's request.</p>`,
      ])
    case "employment-verification":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>To Whom It May Concern,</p>`,
        `<p>This letter confirms that <strong>${name}</strong> is currently employed at ${esc(company)} as <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department${c.startDate ? `, since <strong>${fmtDate(c.startDate)}</strong>` : ""}.</p>`,
        `<p>Employment details may be verified with the Human Resources department during business hours. This letter is issued at the employee's request.</p>`,
      ])
    case "noc":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>To Whom It May Concern,</p>`,
        `<p>This is to certify that ${esc(company)} has no objection to <strong>${name}</strong> (<strong>${esc(c.jobTitle)}</strong>, ${esc(c.department)}) ${esc(c.purpose || "____________")} while remaining an employee of the company.</p>`,
        `<p>This certificate is issued at the employee's request and does not constitute a commitment by the company.</p>`,
      ])
    case "warning":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>Dear ${name},</p>`,
        `<p>This letter serves as a formal first warning regarding <strong>${esc(c.reason || "conduct that falls short of expected standards")}</strong>.</p>`,
        `<p>You are expected to take immediate corrective action. Continued issues may result in further disciplinary measures as per company policy. We encourage you to reach out to your reporting manager or HR for support.</p>`,
      ])
    case "appraisal":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [

        `<p>Dear ${name},</p>`,
        `<p>Based on your performance review, we are pleased to confirm your continued growth as <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department at ${esc(company)}, effective <strong>${fmtDate(c.startDate)}</strong>.</p>`,
        `<p>Your revised compensation will be <strong>${esc(c.monthlySalary || "communicated separately")}</strong> per month. We appreciate your contributions and look forward to your continued impact.</p>`,
      ])
  }
}
