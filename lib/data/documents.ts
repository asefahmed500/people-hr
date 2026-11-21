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
  "confirmation",
  "promotion",
  "transfer",
  "termination",
  "show-cause",
  "appreciation",
  "no-dues",
  "maternity",
  "paternity",
  "salary-revision",
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
  confirmation: "Confirmation of Employment",
  promotion: "Promotion Letter",
  transfer: "Transfer Letter",
  termination: "Termination Letter",
  "show-cause": "Show Cause Notice",
  appreciation: "Appreciation Letter",
  "no-dues": "No Dues Certificate",
  maternity: "Maternity Leave Letter",
  paternity: "Paternity Leave Letter",
  "salary-revision": "Salary Revision Letter",
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
  confirmation: "CFM",
  promotion: "PRO",
  transfer: "TRF",
  termination: "TRM",
  "show-cause": "SHO",
  appreciation: "APP",
  "no-dues": "NDC",
  maternity: "MAT",
  paternity: "PAT",
  "salary-revision": "SVR",
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
    // Match the full prefix (company code + type + year). Ignoring the year
    // made a single old reference inflate every subsequent year's sequence.
    if (
      parts.length < 4 ||
      parts[0] !== code ||
      parts[1] !== REF_PREFIXES[type] ||
      parts[2] !== String(year)
    ) return acc
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
    case "confirmation":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>Dear ${name},</p>`,
        `<p>We are pleased to confirm your employment with ${esc(company)} as <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department, effective <strong>${fmtDate(c.startDate)}</strong>, after successfully completing your probationary period.</p>`,
        `<p>Your continued employment is governed by the company's policies and the terms of your appointment. We value your contribution and look forward to your continued association with us.</p>`,
      ])
    case "promotion":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>Dear ${name},</p>`,
        `<p>We are delighted to inform you that you have been promoted to <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department, effective <strong>${fmtDate(c.startDate)}</strong>.</p>`,
        `<p>This recognition reflects your consistent performance and the trust the team places in you. Your revised compensation will be <strong>${esc(c.monthlySalary || "communicated separately")}</strong> per month. We wish you continued success in your new role.</p>`,
      ])
    case "transfer":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>Dear ${name},</p>`,
        `<p>This letter confirms your transfer to the <strong>${esc(c.department)}</strong> department as <strong>${esc(c.jobTitle)}</strong>, effective <strong>${fmtDate(c.startDate)}</strong>.</p>`,
        `<p>Your reporting manager and the People team will support your transition. All other terms of your employment remain unchanged. We are confident you will make a strong contribution in your new team.</p>`,
      ])
    case "termination":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>Dear ${name},</p>`,
        `<p>We write to formally confirm the conclusion of your employment with ${esc(company)} as <strong>${esc(c.jobTitle)}</strong>, with your last working day being <strong>${fmtDate(c.endDate)}</strong>.</p>`,
        `<p>${esc(c.reason || "The decision follows a review of your employment with the company.")} Your final settlement, including any dues, will be processed in accordance with company policy and applicable law.</p>`,
        `<p>We thank you for your service and wish you the very best for the future.</p>`,
      ])
    case "show-cause":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>Dear ${name},</p>`,
        `<p>It has been observed that <strong>${esc(c.reason || "your conduct or performance has not met expected standards")}</strong>. You are therefore required to show cause within seven (7) working days of receiving this notice as to why disciplinary action should not be initiated against you.</p>`,
        `<p>You may submit a written explanation to the Human Resources department. Your response will be reviewed fairly, and you may seek support from your reporting manager or HR throughout this process.</p>`,
      ])
    case "appreciation":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>Dear ${name},</p>`,
        `<p>We would like to place on record our sincere appreciation for your outstanding contributions as <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department${c.reason ? `, particularly <strong>${esc(c.reason)}</strong>` : ""}.</p>`,
        `<p>Your dedication and the quality of your work have made a meaningful difference to the team. Thank you for the positive impact you continue to make at ${esc(company)}.</p>`,
      ])
    case "no-dues":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>To Whom It May Concern,</p>`,
        `<p>This is to certify that <strong>${name}</strong>, formerly <strong>${esc(c.jobTitle)}</strong> in the ${esc(c.department)} department, has settled all dues and returned all company property as of <strong>${fmtDate(c.endDate)}</strong>.</p>`,
        `<p>No further financial or material obligations remain between the employee and ${esc(company)}. This certificate is issued at the employee's request.</p>`,
      ])
    case "maternity":
    case "paternity": {
      const kind = type === "maternity" ? "maternity" : "paternity"
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>Dear ${name},</p>`,
        `<p>We are pleased to confirm your eligibility for <strong>${kind} leave</strong> in accordance with company policy and applicable law. The leave will run from <strong>${fmtDate(c.startDate)}</strong> to <strong>${fmtDate(c.endDate)}</strong>.</p>`,
        `<p>During your leave, your position will be held and your benefits will continue as per policy. Please coordinate with the People team on handover arrangements before your leave begins. We wish you and your family all the best.</p>`,
      ])
    }
    case "salary-revision":
      return letterShell(c, DOCUMENT_TYPE_LABELS[type], [
        `<p>Dear ${name},</p>`,
        `<p>Following your recent performance review, we are pleased to inform you that your monthly compensation has been revised to <strong>${esc(c.monthlySalary || "the amount communicated separately")}</strong>, effective <strong>${fmtDate(c.startDate)}</strong>.</p>`,
        `<p>All other terms and conditions of your employment remain unchanged. We appreciate your continued contributions to ${esc(company)} and look forward to your ongoing success.</p>`,
      ])
  }
}
