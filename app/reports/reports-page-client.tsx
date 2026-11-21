"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportTemplates } from "@/components/reports/report-templates"
import { ScheduledReports } from "@/components/reports/scheduled-reports"
import { RecentReports } from "@/components/reports/recent-reports"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField, useForm } from "@/components/shared/field"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { notify } from "@/lib/toast"
import { pushNotification } from "@/lib/stores/notifications"
import { exportToCsv } from "@/lib/export"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import {
  type ReportsStore,
  type ScheduledReport,
  type Employee,
  type LeaveStore,
  type PayrollStore,
  type AttendanceStore,
  type RecruitmentStore,
  defaultReportsStore,
  defaultLeaveStore,
  defaultPayrollStore,
  defaultRecruitmentStore,
} from "@/lib/data"

const CADENCES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

const FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
  { value: "slides", label: "Slides" },
]

const FORMAT_LABELS: Record<string, string> = {
  pdf: "PDF",
  csv: "CSV",
  xlsx: "Excel",
  slides: "Slides",
}

// Template titles â†’ valid report types (the titles aren't a clean slug).
function typeFromTitle(title: string): string {
  const t = title.toLowerCase()
  if (t.includes("payroll")) return "payroll"
  if (t.includes("attendance")) return "attendance"
  if (t.includes("engagement")) return "engagement"
  return "headcount"
}

export function ReportsPageClient() {
  const { user } = useAuth()
  const canWrite = user?.role === "admin"
  const { state, setState, hydrated, error: reportsError, retry: retryReports } = useApiStore<ReportsStore>(
    "/api/store/reports",
    () => defaultReportsStore,
  )
  // Reports are generated from the real workspace documents, not from the
  // report schedule itself.
  const employees = useApiStore<Employee[]>("/api/store/employees", () => [])
  const leave = useApiStore<LeaveStore>("/api/store/leave", () => defaultLeaveStore)
  const payroll = useApiStore<PayrollStore>("/api/store/payroll", () => defaultPayrollStore)
  const attendance = useApiStore<AttendanceStore>("/api/store/attendance", () => ({ checkIns: [] }))
  const recruitment = useApiStore<RecruitmentStore>("/api/store/recruitment", () => defaultRecruitmentStore)
  const error =
    reportsError ||
    employees.error ||
    leave.error ||
    payroll.error ||
    attendance.error ||
    recruitment.error
  const retry = () => {
    retryReports()
    employees.retry()
    leave.retry()
    payroll.retry()
    attendance.retry()
    recruitment.retry()
  }

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<ScheduledReport | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null)

  const form = useForm({
    name: "",
    type: "headcount",
    format: "pdf",
    cadence: "monthly",
    recipients: "1",
    nextRun: "Next month",
  })

  function openCreate(templateTitle?: string, type?: string) {
    setEditTarget(null)
    form.reset({
      name: templateTitle ?? "",
      type: type ?? "headcount",
      format: "pdf",
      cadence: "monthly",
      recipients: "1",
      nextRun: "Next month",
    })
    setDialogOpen(true)
  }

  function openEdit(report: ScheduledReport) {
    setEditTarget(report)
    const format = FORMATS.some((f) => f.value === report.format.toLowerCase())
      ? report.format.toLowerCase()
      : "pdf"
    form.reset({
      name: report.name,
      type: report.type,
      format,
      cadence: report.cadence,
      recipients: report.recipients,
      nextRun: report.nextRun,
    })
    setDialogOpen(true)
  }

  function handleSaveReport() {
    if (!form.values.name.trim()) {
      notify.error("Missing name", "Please enter a report name.")
      return
    }
    const formatLabel = FORMAT_LABELS[form.values.format] ?? form.values.format.toUpperCase()
    const payload: ScheduledReport = {
      id: editTarget?.id ?? `sr-${Date.now()}`,
      name: form.values.name.trim(),
      type: form.values.type,
      format: formatLabel,
      cadence: form.values.cadence as ScheduledReport["cadence"],
      nextRun: form.values.nextRun || "Next month",
      recipients: form.values.recipients,
      tone: editTarget?.tone ?? "forest",
      enabled: editTarget?.enabled ?? true,
    }
    setState((prev) => {
      const exists = prev.scheduled.some((r) => r.id === payload.id)
      return {
        ...prev,
        scheduled: exists
          ? prev.scheduled.map((r) => (r.id === payload.id ? payload : r))
          : [...prev.scheduled, payload],
      }
    })
    notify.success(
      editTarget ? "Report updated" : "Report created",
      `â€œ${payload.name}â€ will be generated in-app ${payload.cadence} and appear under Recent exports with a notification. No email is sent.`,
    )
    if (!editTarget) {
    }
    setDialogOpen(false)
    setEditTarget(null)
  }

  function handleDeleteReport() {
    if (!deleteTarget) return
    setState((prev) => ({
      ...prev,
      scheduled: prev.scheduled.filter((r) => r.id !== deleteTarget.id),
    }))
    notify.success(`Report "${deleteTarget.name}" deleted`)
    setDeleteTarget(null)
  }

  function handleToggleEnabled(id: string, enabled: boolean) {
    setState((prev) => ({
      ...prev,
      scheduled: prev.scheduled.map((r) => (r.id === id ? { ...r, enabled } : r)),
    }))
    const report = state.scheduled.find((r) => r.id === id)
    notify.success(
      enabled ? "Report resumed" : "Report paused",
      report ? `${report.name} is ${enabled ? "active" : "paused"}.` : undefined,
    )
  }

  /** Pull live rows from the module that owns this report's subject. */
  function reportRows(type: string): Record<string, unknown>[] {
    switch (type) {
      case "payroll":
        return payroll.state.payments.map((p) => ({
          Name: p.name, Department: p.department, Role: p.role,
          Gross: p.gross, Deductions: p.deductions, Status: p.status,
        }))
      case "attendance":
        return attendance.state.checkIns.map((c) => ({
          Name: c.name, Department: c.dept, Date: c.date ?? "",
          Time: c.time, Status: c.status,
        }))
      case "recruitment":
        return recruitment.state.candidates.map((c) => ({
          Name: c.name, Role: c.role, Department: c.department,
          Stage: c.stage, Applied: c.appliedAt,
        }))
      case "leave":
        return leave.state.requests.map((r) => ({
          Employee: r.employeeName, Type: r.type, Status: r.status,
          From: r.startDate, To: r.endDate, Days: r.days, Reason: r.reason,
        }))
      case "engagement":
      case "headcount":
      default:
        return employees.state.map((e) => ({
          Name: e.name, Email: e.email, Department: e.department,
          Role: e.role, Status: e.status, Location: e.location,
        }))
    }
  }

  function downloadRows(filename: string, rows: Record<string, unknown>[]) {
    // Never fabricate a data row. Export an empty CSV with a header instead.
    const columns = rows.length
      ? Object.keys(rows[0]).map((key) => ({ key, label: key }))
      : [{ key: "Result", label: "Result" }]
    exportToCsv(filename, rows, columns)
  }

  function handleGenerateNow(report: ScheduledReport) {
    const rows = reportRows(report.type)
    downloadRows(`${report.name.replace(/\s+/g, "-").toLowerCase()}-report`, rows)
    const record = {
      id: `r-${crypto.randomUUID()}`,
      name: report.name,
      date: new Date().toISOString().slice(0, 10),
      size: `${rows.length} row${rows.length === 1 ? "" : "s"}`,
      status: "ready" as const,
      tone: report.tone,
      reportType: report.type,
    }
    setState((prev) => ({ ...prev, recent: [record, ...prev.recent].slice(0, 20) }))
    pushNotification({
      type: "report_generated",
      title: "Report generated",
      description: `${report.name} (${rows.length} rows) is ready under Recent exports.`,
      href: "/reports",
    })
    notify.success("Report generated", `${report.name} (${rows.length} rows) downloaded as CSV.`)
  }

  function handleDownloadRecent(name: string, reportType?: string) {
    const rows = reportRows(reportType ?? typeFromTitle(name))
    downloadRows(name.replace(/\s+/g, "-").toLowerCase(), rows)
    notify.success("Report downloaded", `${name} (${rows.length} rows) downloaded as CSV.`)
  }

  if (error) {
    return (
      <DashboardShell activeHref="/reports" current="Reports" accentCurrent>
        <StoreErrorState onRetry={retry} />
      </DashboardShell>
    )
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/reports" current="Reports" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <Skeleton className="mt-4 h-24 w-full rounded-lg" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-[300px] flex-1 rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg lg:w-[420px]" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <>
      <DashboardShell activeHref="/reports" current="Reports" accentCurrent>
        <ReportsHeader onNewReport={canWrite ? () => openCreate() : undefined} />
        <ReportTemplates
          templates={state.templates}
          onSelect={
            canWrite
              ? (title) => openCreate(title, typeFromTitle(title))
              : undefined
          }
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <ScheduledReports
            scheduled={state.scheduled}
            onGenerateNow={canWrite ? handleGenerateNow : undefined}
            onToggleEnabled={canWrite ? handleToggleEnabled : undefined}
            onReportAction={
              canWrite
                ? (id, name, action) => {
                    if (action === "delete") {
                      setDeleteTarget({ id, name })
                    } else if (action === "edit") {
                      const report = state.scheduled.find((r) => r.id === id)
                      if (report) openEdit(report)
                    }
                  }
                : undefined
            }
          />
          <RecentReports
            recent={state.recent}
            onDownload={handleDownloadRecent}
          />
        </div>
      </DashboardShell>

      <ActionDialog width="wide"
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditTarget(null) }}
        title={editTarget ? "Edit report" : "New report"}
        description="Scheduled reports are generated in the app on their cadence and appear under Recent exports with a notification. No emails are sent."
        submitLabel={editTarget ? "Save changes" : "Create"}
        onSubmit={handleSaveReport}
      >
        <Field label="Report name" value={form.values.name} onChange={(v) => form.setValue("name", v)} required />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Type"
            value={form.values.type}
            onChange={(v) => form.setValue("type", v)}
            options={[
              { value: "headcount", label: "Headcount report" },
              { value: "payroll", label: "Payroll summary" },
              { value: "attendance", label: "Attendance report" },
              { value: "engagement", label: "Engagement survey" },
            ]}
          />
          <SelectField
            label="Format"
            value={form.values.format}
            onChange={(v) => form.setValue("format", v)}
            options={FORMATS}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Cadence"
            value={form.values.cadence}
            onChange={(v) => form.setValue("cadence", v)}
            options={CADENCES}
          />
          <Field
            label="Audience (label only)"
            value={form.values.recipients}
            onChange={(v) => form.setValue("recipients", v)}
            placeholder="People team Â· 4"
          />
        </div>
        <Field
          label="Next run"
          value={form.values.nextRun}
          onChange={(v) => form.setValue("nextRun", v)}
          placeholder="e.g. 2026-12-01 or Monthly"
        />
      </ActionDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteReport}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
