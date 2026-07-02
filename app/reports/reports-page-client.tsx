"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportTemplates } from "@/components/reports/report-templates"
import { ScheduledReports } from "@/components/reports/scheduled-reports"
import { RecentReports } from "@/components/reports/recent-reports"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField, useForm } from "@/components/shared/field"
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
import { useMockStore } from "@/hooks/use-mock-store"
import {
  STORAGE_KEYS,
  type ReportsStore,
  type ScheduledReport,
  defaultReportsStore,
  defaultNotificationsStore,
  newNotification,
  type NotificationsStore,
  type Notification,
} from "@/lib/data"

export function ReportsPageClient() {
  const { state, setState, hydrated } = useMockStore<ReportsStore>(
    STORAGE_KEYS.reports,
    () => defaultReportsStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null)

  const form = useForm({ name: "", type: "headcount", format: "pdf" })

  function handleCreateReport() {
    const newReport: ScheduledReport = {
      id: `sr-${Date.now()}`,
      name: form.values.name,
      format: form.values.format === "xlsx" ? "Excel" : form.values.format.toUpperCase(),
      cadence: "monthly",
      nextRun: "Next month",
      recipients: "1",
      tone: "forest",
      enabled: true,
    }
    setState((prev) => ({
      ...prev,
      scheduled: [...prev.scheduled, newReport],
    }))
    notify.success(`Report "${form.values.name}" created`)
    addNotification({ type: "report_generated", title: "Report created", description: `${form.values.name} ${form.values.type} report generated`, href: "/reports" })
    setDialogOpen(false)
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

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/reports" current="Reports" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <Skeleton className="mt-4 h-24 w-full rounded-[18px]" />
        <div className="mt-5 flex gap-5">
          <Skeleton className="h-[300px] flex-1 rounded-[18px]" />
          <Skeleton className="h-[300px] w-[420px] rounded-[18px]" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <>
      <DashboardShell activeHref="/reports" current="Reports" accentCurrent>
        <ReportsHeader
          onPeriodChange={() => notify.info("Period changed to This quarter")}
          onNewReport={() => {
            form.reset()
            setDialogOpen(true)
          }}
        />
        <ReportTemplates
          templates={state.templates}
          onSelect={(title) => notify.info(`Creating report from template: ${title}`)}
        />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <ScheduledReports
            scheduled={state.scheduled}
            onManage={() => notify.info("Managing scheduled reports")}
            onReportAction={(id, name, action) => {
              if (action === "delete") {
                setDeleteTarget({ id, name })
              } else {
                notify.info(`Editing report: ${name}`)
              }
            }}
          />
          <RecentReports
            recent={state.recent}
            onViewAll={() => notify.info("Viewing all recent exports")}
            onDownload={(name) => notify.success(`Report downloaded: ${name}`)}
          />
        </div>
      </DashboardShell>

      <ActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="New report"
        submitLabel="Create"
        onSubmit={handleCreateReport}
      >
        <Field label="Report name" value={form.values.name} onChange={(v) => form.setValue("name", v)} required />
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
          options={[
            { value: "pdf", label: "PDF" },
            { value: "csv", label: "CSV" },
            { value: "xlsx", label: "Excel" },
          ]}
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
              Are you sure you want to delete "{deleteTarget?.name}"?
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
