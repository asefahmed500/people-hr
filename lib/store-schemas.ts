// Server-side validation schemas for each ModuleState document key.
// The client's useApiStore PUTs whole documents; these ensure a direct API
// caller can't corrupt the workspace with an arbitrary JSON shape.

import { z } from "zod"

import { DEPARTMENTS } from "@/lib/data/types"
import { DOCUMENT_TYPES } from "@/lib/data/documents"
import { EMPLOYEE_STATUSES } from "@/lib/data/employees"

const id = z.string().min(1)
const department = z.enum(DEPARTMENTS)

// `used` accumulates leave days, which include half days (0.5) — it must not
// be int-only or approving a half-day request would always fail validation.
const balanceBucket = z.object({
  used: z.number().min(0).multipleOf(0.5),
  total: z.number().int().min(0),
})

const balances = z.object({
  annual: balanceBucket,
  sick: balanceBucket,
  personal: balanceBucket,
  parental: balanceBucket,
})

const employee = z.object({
  id,
  name: z.string().min(1),
  // Empty is allowed: hires can enter the directory before an email is known.
  email: z.string(),
  initials: z.string().min(1),
  department,
  role: z.string(),
  location: z.string(),
  status: z.enum(EMPLOYEE_STATUSES),
  avatar: z.string().optional(),
  hiredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hiredDaysAgo: z.number().int().min(0),
  phone: z.string().optional(),
  employmentType: z.enum(["full-time", "part-time", "contract", "intern"]).optional(),
  reportingManager: z.string().optional(),
  salary: z.number().int().min(0).optional(),
  // Personnel-file attachments (identity, contract, certificates, etc.).
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number().min(0),
    dataUrl: z.string(),
    kind: z.enum(["identity", "contract", "certificate", "supporting", "other"]),
    required: z.boolean(),
    uploadedAt: z.string(),
    uploadedBy: z.string().optional(),
  })).optional(),
})

const leaveRequest = z.object({
  id,
  employeeId: id,
  employeeName: z.string().min(1),
  initials: z.string().min(1),
  type: z.enum(["vac", "sick", "pers", "par"]),
  status: z.enum(["approved", "pending", "declined"]),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number().min(0.5).multipleOf(0.5),
  reason: z.string(),
  halfDay: z.boolean().optional(),
})

const candidate = z.object({
  id,
  name: z.string().min(1),
  initials: z.string().min(1),
  role: z.string().min(1),
  department,
  appliedAt: z.string(),
  stage: z.enum(["applied", "screening", "interview", "offer", "hired"]),
  source: z.string().optional(),
})

const opening = z.object({
  id,
  title: z.string().min(1),
  department,
  location: z.string(),
  applicants: z.number().int().min(0),
  postedDaysAgo: z.number().int().min(0),
})

const projectTask = z.object({
  id,
  name: z.string().min(1),
  ownerName: z.string().min(1),
  ownerInit: z.string().min(1),
  department,
  progress: z.number().int().min(0).max(100),
  dueOrShipped: z.string(),
  status: z.enum(["on-track", "at-risk", "delayed", "on-hold"]),
  tone: z.enum(["green", "amber", "forest", "mint", "coral", "slate"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
})

const keyResult = z.object({
  id,
  label: z.string().min(1),
  pct: z.number().int().min(0).max(100),
})

const objective = z.object({
  id,
  eyebrow: z.string(),
  title: z.string().min(1),
  ownerInit: z.string().min(1),
  ownerName: z.string().min(1),
  ownerRole: z.string(),
  progress: z.number().int().min(0).max(100),
  status: z.enum(["on-track", "at-risk", "completed"]),
  krs: z.array(keyResult),
  deadline: z.string().optional(),
  description: z.string().optional(),
})

const payment = z.object({
  id,
  initials: z.string().min(1),
  name: z.string().min(1),
  role: z.string(),
  department,
  gross: z.number().int().min(0),
  deductions: z.number().int().min(0),
  status: z.enum(["paid", "pending", "failed"]),
})

const payslip = z.object({
  id,
  employeeId: id,
  employeeName: z.string().min(1),
  initials: z.string().min(1),
  department,
  jobTitle: z.string(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  issuedAt: z.string(),
  status: z.enum(["draft", "paid"]),
  earnings: z.object({
    basic: z.number().int().min(0),
    housing: z.number().int().min(0),
    transport: z.number().int().min(0),
    special: z.number().int().min(0),
    other: z.number().int().min(0),
  }),
  deductions: z.object({
    incomeTax: z.number().int().min(0),
    providentFund: z.number().int().min(0),
    healthInsurance: z.number().int().min(0),
    professionalTax: z.number().int().min(0),
  }),
  notes: z.string().optional(),
})

const review = z.object({
  id,
  initials: z.string().min(1),
  avatarBg: z.string(),
  name: z.string().min(1),
  role: z.string(),
  deptDot: z.string(),
  department,
  reviewer: z.string(),
  rating: z.number().min(0).max(5),
  status: z.enum(["exceeds", "meets", "below", "needs"]),
  comments: z.string().optional(),
  reviewedAt: z.string().optional(),
  period: z.string().optional(),
})

const teamRow = z.object({
  rank: z.number().int().min(1),
  dot: z.string(),
  team: department,
  reviewed: z.string(),
  fillPct: z.number().int().min(0).max(100),
  fill: z.string(),
  rating: z.string(),
  rankBg: z.string(),
  rankText: z.string(),
})

const onboardingTask = z.object({
  id,
  hireInit: z.string().min(1),
  hireName: z.string().min(1),
  hireRole: z.string(),
  hireDept: z.string(),
  phase: z.enum(["pre", "w1", "m1", "ramped"]),
  done: z.boolean(),
  label: z.string(),
})

const checkIn = z.object({
  id,
  // Written by the face check-in route — stripping it breaks one-per-account matching.
  userId: z.string().optional(),
  initials: z.string().min(1),
  name: z.string().min(1),
  dept: z.string(),
  time: z.string(),
  status: z.enum(["on-time", "late", "remote"]),
  date: z.string().optional(),
})

const dept = z.object({
  id,
  code: z.string(),
  name: z.string().min(1),
  sub: z.string(),
  people: z.number().int().min(0),
  teams: z.number().int().min(0),
  open: z.number().int().min(0),
  leadInit: z.string(),
  leadName: z.string(),
  leadRole: z.string(),
  iconBg: z.string(),
  iconText: z.string(),
})

const office = z.object({
  id: z.string().optional(),
  city: z.string().min(1),
  country: z.string(),
  count: z.number().int().min(0),
  fillPct: z.number().int().min(0).max(100),
  fill: z.string(),
})

const orgNode = z.object({
  initials: z.string(),
  name: z.string().min(1),
  role: z.string(),
  isCeo: z.boolean().optional(),
})

const personal = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  jobTitle: z.string(),
  department: z.string(),
  avatar: z.string().optional(),
})

const preferences = z.object({
  emailDigest: z.boolean(),
  desktopNotifications: z.boolean(),
  weeklyReport: z.boolean(),
  twoFactor: z.boolean(),
})

const monthlyTrend = z.object({
  month: z.string().min(1),
  value: z.number().int().min(0),
  current: z.boolean().optional(),
})

const breakdown = z.object({
  label: z.string().min(1),
  pct: z.number().int().min(0).max(100),
  count: z.number().int().min(0),
  fill: z.string(),
})

const reportTemplate = z.object({
  id,
  title: z.string().min(1),
  desc: z.string(),
  iconBg: z.string(),
  iconColor: z.string(),
})

const scheduledReport = z.object({
  id,
  name: z.string().min(1),
  type: z.string().min(1),
  format: z.string().min(1),
  cadence: z.enum(["daily", "weekly", "monthly"]),
  nextRun: z.string(),
  recipients: z.string(),
  tone: z.enum(["forest", "mint", "amber", "slate"]),
  enabled: z.boolean(),
})

const recentReport = z.object({
  id,
  name: z.string().min(1),
  date: z.string(),
  size: z.string(),
  status: z.enum(["ready", "generating", "failed"]),
  tone: z.enum(["forest", "mint", "amber", "slate"]),
  reportType: z.string().optional(),
})

const chatMessage = z.object({
  id,
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  ts: z.number(),
})

const conversation = z.object({
  id,
  title: z.string().min(1),
  updatedAt: z.number(),
  messages: z.array(chatMessage),
})

const announcement = z.object({
  id,
  title: z.string().min(1),
  body: z.string().min(1),
  author: z.string().min(1),
  audience: z.string().optional(),
  pinned: z.boolean(),
  createdAt: z.number(),
})

const hrDocument = z.object({
  id,
  // Single source of truth: the 20 templates shown in the gallery must all be
  // savable. The old hardcoded 10-value list made half the catalog inert.
  type: z.enum(DOCUMENT_TYPES),
  title: z.string().min(1),
  refNo: z.string().min(1),
  status: z.enum(["draft", "issued"]),
  employeeName: z.string().min(1),
  department: z.string(),
  jobTitle: z.string(),
  issueDate: z.string(),
  body: z.string(),
  createdBy: z.string(),
  createdAt: z.number(),
})

export const STORE_SCHEMAS: Record<string, z.ZodType> = {
  // Emails are used as identity for role scoping — duplicates would make
  // ownership ambiguous and let one user reach another's row.
  employees: z.array(employee).superRefine((rows, ctx) => {
    const seen = new Set<string>()
    rows.forEach((row, index) => {
      const email = String(row.email ?? "").trim().toLowerCase()
      if (!email || email === "user@example.com") return
      if (seen.has(email)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "email"],
          message: "Duplicate email in the directory.",
        })
      }
      seen.add(email)
    })
  }),
  leave: z.object({ requests: z.array(leaveRequest), balances: z.record(id, balances) }),
  recruitment: z.object({ candidates: z.array(candidate), openings: z.array(opening) }),
  projects: z.object({ tasks: z.array(projectTask) }),
  goals: z.object({ objectives: z.array(objective) }),
  payroll: z.object({
    payments: z.array(payment),
    lastRun: z
      .string()
      .nullable()
      .refine((v) => v === null || v === "" || !Number.isNaN(Date.parse(v))),
  }),
  payslips: z.object({ payslips: z.array(payslip) }),
  performance: z.object({ reviews: z.array(review), teamScores: z.array(teamRow) }),
  onboarding: z.object({ tasks: z.array(onboardingTask) }),
  attendance: z.object({ checkIns: z.array(checkIn) }),
  organization: z.object({
    companyName: z.string(),
    departments: z.array(dept),
    offices: z.array(office),
    orgChart: z.array(orgNode),
  }),
  settings: z.object({ personal, preferences }),
  analytics: z.object({
    headcount: z.number().int().min(0),
    headcountDelta: z.string(),
    attrition: z.string(),
    attritionDelta: z.string(),
    avgTenure: z.string(),
    avgTenureDelta: z.string(),
    offerAcceptRate: z.string(),
    offerAcceptRateDelta: z.string(),
    monthlyTrend: z.array(monthlyTrend),
    byDept: z.array(breakdown),
    byTenure: z.array(breakdown),
  }),
  reports: z.object({
    templates: z.array(reportTemplate),
    scheduled: z.array(scheduledReport),
    recent: z.array(recentReport),
  }),
  assistant: z.object({
    conversations: z.array(conversation),
    activeId: z.string().nullable(),
  }),
  documents: z.object({ documents: z.array(hrDocument) }),
  announcements: z.object({ announcements: z.array(announcement) }),
}
