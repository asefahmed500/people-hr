// Runs due scheduled reports. Reports are generated in-app — no email is sent.
//
// - POST (admin-only) is the manual/cron entry point.
// - `runDueReports` is also called by the in-process timer in instrumentation.ts.
//
// Idempotency lives in a dedicated ModuleState ledger (`__reports_schedules__`)
// rather than on the schedule itself: the reports document is replaced by the
// client on every edit, so a field stored there would be clobbered. The ledger
// is invisible to the store API and survives client edits.

import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guards"
import { notifyScheduledReport } from "@/lib/notify-server"
import { defaultReportsStore } from "@/lib/data/reports"
import type { Cadence, RecentReportRecord, ReportsStore, ScheduledReport } from "@/lib/data/reports"
import type { Employee } from "@/lib/data/employees"
import type { LeaveStore } from "@/lib/data/leave"
import type { PayrollStore } from "@/lib/data/payroll"
import type { AttendanceStore } from "@/lib/data/attendance"
import type { RecruitmentStore } from "@/lib/data/recruitment"

const WORKSPACE_ID = "__workspace__"
const LEDGER_SCOPE = "__reports_schedules__"
const LEDGER_KEY = "run-ledger"
const CAS_RETRIES = 3

type RunLedger = { runs: Record<string, string> }
type LiveDocs = {
  employees: Employee[]
  leave: LeaveStore
  payroll: PayrollStore
  attendance: AttendanceStore
  recruitment: RecruitmentStore
}
type Period = { id: string; deferUntilMs: number | null }
export type RunDueResult = {
  checked: number
  ran: string[]
  skipped: number
  errors: number
}

export type GenerateReportResult = {
  generated: boolean
  name: string
  rows: number
  id?: string
}

// --- scheduling -------------------------------------------------------------

function parseIsoDate(text: string): Date | null {
  if (!text) return null
  // YYYY-MM-DD (optionally with a time) or a full ISO timestamp.
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(text)) return null
  const parsed = new Date(text.length === 10 ? `${text}T00:00:00Z` : text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function cadenceFromText(text: string): Cadence | null {
  const t = text.toLowerCase()
  if (t.includes("daily") || t.includes("every day")) return "daily"
  if (t.includes("weekly") || t.includes("every week")) return "weekly"
  if (t.includes("monthly") || t.includes("every month")) return "monthly"
  return null
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

/**
 * Turn a schedule into a period key (one run per period) and an optional
 * "not before" instant. ISO dates are one-off runs at that instant; cadence
 * words and the `cadence` field drive recurring runs. Relative free text like
 * "Next month" is treated as cadence-driven, not as a literal computed date.
 */
function periodFor(schedule: ScheduledReport, now: number): Period {
  const text = (schedule.nextRun || "").trim()
  const absolute = parseIsoDate(text)
  if (absolute) {
    return { id: `date:${absolute.toISOString().slice(0, 10)}`, deferUntilMs: absolute.getTime() }
  }
  const cadence = cadenceFromText(text) ?? schedule.cadence
  const d = new Date(now)
  if (cadence === "daily") return { id: `daily:${d.toISOString().slice(0, 10)}`, deferUntilMs: null }
  if (cadence === "weekly") return { id: `weekly:${isoWeek(d)}`, deferUntilMs: null }
  return { id: `monthly:${d.toISOString().slice(0, 7)}`, deferUntilMs: null }
}

// --- report generation ------------------------------------------------------

// Same title → type mapping and type switch the Reports page uses.
function typeFromTitle(title: string): string {
  const t = title.toLowerCase()
  if (t.includes("payroll")) return "payroll"
  if (t.includes("attendance")) return "attendance"
  if (t.includes("engagement")) return "engagement"
  return "headcount"
}

async function loadLiveDocs(): Promise<LiveDocs> {
  const read = async <T>(key: string, fallback: T): Promise<T> => {
    const doc = await prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key } },
    })
    return (doc?.data as T | null) ?? fallback
  }
  const [employees, leave, payroll, attendance, recruitment] = await Promise.all([
    read<Employee[]>("employees", []),
    read<LeaveStore>("leave", { requests: [], balances: {} }),
    read<PayrollStore>("payroll", { payments: [], lastRun: null }),
    read<AttendanceStore>("attendance", { checkIns: [] }),
    read<RecruitmentStore>("recruitment", { candidates: [], openings: [] }),
  ])
  return { employees, leave, payroll, attendance, recruitment }
}

function selectRows(type: string, d: LiveDocs): Record<string, unknown>[] {
  switch (type) {
    case "payroll":
      return (d.payroll?.payments ?? []).map((p) => ({
        Name: p.name, Department: p.department, Role: p.role,
        Gross: p.gross, Deductions: p.deductions, Status: p.status,
      }))
    case "attendance":
      return (d.attendance?.checkIns ?? []).map((c) => ({
        Name: c.name, Department: c.dept, Date: c.date ?? "",
        Time: c.time, Status: c.status,
      }))
    case "recruitment":
      return (d.recruitment?.candidates ?? []).map((c) => ({
        Name: c.name, Role: c.role, Department: c.department,
        Stage: c.stage, Applied: c.appliedAt,
      }))
    case "leave":
      return (d.leave?.requests ?? []).map((r) => ({
        Employee: r.employeeName, Type: r.type, Status: r.status,
        From: r.startDate, To: r.endDate, Days: r.days, Reason: r.reason,
      }))
    case "engagement":
    case "headcount":
    default:
      return (Array.isArray(d.employees) ? d.employees : []).map((e) => ({
        Name: e.name, Email: e.email, Department: e.department,
        Role: e.role, Status: e.status, Location: e.location,
      }))
  }
}

// --- persistence ------------------------------------------------------------

async function loadLedger(): Promise<RunLedger> {
  const doc = await prisma.moduleState.findUnique({
    where: { userId_key: { userId: LEDGER_SCOPE, key: LEDGER_KEY } },
  })
  const data = doc?.data as RunLedger | null
  return data && typeof data.runs === "object" && data.runs ? data : { runs: {} }
}

/** Merge new period keys into the ledger with CAS + retries. */
async function persistLedger(newRuns: Record<string, string>): Promise<boolean> {
  for (let attempt = 0; attempt < CAS_RETRIES; attempt++) {
    try {
      const doc = await prisma.moduleState.findUnique({
        where: { userId_key: { userId: LEDGER_SCOPE, key: LEDGER_KEY } },
      })
      const current = await loadLedger()
      const next: RunLedger = { runs: { ...current.runs, ...newRuns } }
      if (!doc) {
        await prisma.moduleState.create({
          data: {
            userId: LEDGER_SCOPE,
            key: LEDGER_KEY,
            data: next as unknown as Prisma.InputJsonValue,
          },
        })
        return true
      }
      const swapped = await prisma.moduleState.updateMany({
        where: { id: doc.id, updatedAt: doc.updatedAt },
        data: { data: next as unknown as Prisma.InputJsonValue },
      })
      if (swapped.count > 0) return true
    } catch {
      return false
    }
  }
  return false
}

/**
 * Add the new records to the reports document with CAS + retries, merging by
 * id onto whatever a concurrent writer stored so nothing is lost.
 */
async function persistRecent(records: RecentReportRecord[]): Promise<boolean> {
  for (let attempt = 0; attempt < CAS_RETRIES; attempt++) {
    try {
      const doc = await prisma.moduleState.findUnique({
        where: { userId_key: { userId: WORKSPACE_ID, key: "reports" } },
      })
      if (!doc) return false
      const current = doc.data as ReportsStore
      const existing = Array.isArray(current.recent) ? current.recent : []
      const seen = new Set(existing.map((r) => r.id))
      const merged = [...records.filter((r) => !seen.has(r.id)), ...existing].slice(0, 20)
      const swapped = await prisma.moduleState.updateMany({
        where: { id: doc.id, updatedAt: doc.updatedAt },
        data: {
          data: { ...current, recent: merged } as unknown as Prisma.InputJsonValue,
        },
      })
      if (swapped.count > 0) return true
    } catch {
      return false
    }
  }
  return false
}

// --- runner -----------------------------------------------------------------

export async function runDueReports(): Promise<RunDueResult> {
  const result: RunDueResult = { checked: 0, ran: [], skipped: 0, errors: 0 }
  try {
    const doc = await prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key: "reports" } },
    })
    if (!doc) return result
    const reports = (doc.data as ReportsStore | null) ?? defaultReportsStore
    const schedules = Array.isArray(reports.scheduled) ? reports.scheduled : []
    if (schedules.length === 0) return result

    const ledger = await loadLedger()
    const now = Date.now()
    const newRecords: RecentReportRecord[] = []
    const newRuns: Record<string, string> = {}
    const generated: Array<{ name: string; rows: number }> = []
    let live: LiveDocs | null = null

    for (const schedule of schedules) {
      if (!schedule.enabled) continue
      result.checked += 1

      const period = periodFor(schedule, now)
      const key = `${schedule.id}:${period.id}`
      if (period.deferUntilMs !== null && now < period.deferUntilMs) {
        result.skipped += 1
        continue
      }
      if (ledger.runs[key]) {
        result.skipped += 1
        continue
      }

      try {
        if (!live) live = await loadLiveDocs()
        const type = typeFromTitle(schedule.type || schedule.name)
        const rows = selectRows(type, live)
        const stamp = new Date(now).toISOString()
        newRecords.push({
          id: `r-${crypto.randomUUID()}`,
          name: schedule.name,
          date: stamp.slice(0, 10),
          size: `${rows.length} row${rows.length === 1 ? "" : "s"}`,
          status: "ready",
          tone: schedule.tone,
          // Persist the source module so re-downloads regenerate the same rows.
          reportType: type,
        })
        newRuns[key] = stamp
        newRuns[`last:${schedule.id}`] = stamp
        generated.push({ name: schedule.name, rows: rows.length })
        result.ran.push(schedule.name)
      } catch {
        result.errors += 1
      }
    }

    if (newRecords.length === 0) return result

    // Land the exports first; only mark the ledger once they're stored so a
    // failed write is retried on the next tick instead of being lost.
    const wrote = await persistRecent(newRecords)
    if (!wrote) {
      return { ...result, ran: [], errors: result.errors + newRecords.length }
    }
    await persistLedger(newRuns)

    for (const report of generated) {
      await notifyScheduledReport({ reportName: report.name, rows: report.rows })
    }
    return result
  } catch {
    return result
  }
}

/**
 * Generate one ad-hoc report from live module data and add it to Recent exports.
 *
 * This deliberately does NOT touch the schedule ledger: a manual/queued
 * `report.generate` is an explicit new export, while `runDueReports` uses the
 * ledger to stay idempotent for scheduled cadences. Reuses the same row
 * selection, persistence (CAS) and admin fan-out as scheduled generation.
 */
export async function generateReport(opts: {
  name?: string
  type?: string
  tone?: string
}): Promise<GenerateReportResult> {
  const name = (opts.name ?? "").trim() || "Ad-hoc report"
  const requested = (opts.type ?? "").trim()
  const type = requested || typeFromTitle(name)
  const live = await loadLiveDocs()
  const rows = selectRows(type, live)
  const stamp = new Date().toISOString()
  const tone = (["forest", "mint", "amber", "slate"] as string[]).includes(opts.tone ?? "")
    ? (opts.tone as RecentReportRecord["tone"])
    : "forest"
  const record: RecentReportRecord = {
    id: `r-${crypto.randomUUID()}`,
    name,
    date: stamp.slice(0, 10),
    size: `${rows.length} row${rows.length === 1 ? "" : "s"}`,
    status: "ready",
    tone,
  }
  const wrote = await persistRecent([record])
  if (!wrote) return { generated: false, name, rows: rows.length }
  await notifyScheduledReport({ reportName: name, rows: rows.length })
  return { generated: true, name, rows: rows.length, id: record.id }
}

// POST /api/reports/run-due — manual trigger / external cron hook.
export async function POST() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const result = await runDueReports()
  return NextResponse.json(result)
}
