"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { OrgHeader } from "@/components/organization/org-header"
import { OrgStatRow } from "@/components/organization/org-stat-row"
import { OrgChartCard } from "@/components/organization/org-chart-card"
import { DepartmentsSection } from "@/components/organization/departments-section"
import { OfficesCard } from "@/components/organization/offices-card"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, TextArea, useForm } from "@/components/shared/field"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { type OrganizationStore, type Dept, type Office, defaultOrganizationStore } from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
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

function generateCode(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function generateInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export function OrganizationPageClient() {
  const { user } = useAuth()
  const canWrite = user?.role === "admin"
  const { state: store, setState, hydrated } = useApiStore<OrganizationStore>(
    "/api/store/organization",
    () => defaultOrganizationStore,
  )

  const [chartExpanded, setChartExpanded] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [officeDialogOpen, setOfficeDialogOpen] = React.useState(false)
  const [editingOffice, setEditingOffice] = React.useState<Office | null>(null)
  const [deletingOffice, setDeletingOffice] = React.useState<Office | null>(null)
  const [editingDept, setEditingDept] = React.useState<Dept | null>(null)
  const [viewingDept, setViewingDept] = React.useState<Dept | null>(null)
  const [deletingDept, setDeletingDept] = React.useState<Dept | null>(null)

  // The real workspace name, used on HR letters, PDF exports and the
  // settings panel. Saved into the org document (admins only).
  const [companyDraft, setCompanyDraft] = React.useState<string | null>(null)
  const companyNameValue = companyDraft ?? (store.companyName ?? "")
  const commitCompanyName = () => {
    if (companyDraft === null) return
    const next = companyDraft.trim()
    if (next === (store.companyName ?? "")) {
      setCompanyDraft(null)
      return
    }
    setState((prev) => ({ ...prev, companyName: next }))
    setCompanyDraft(null)
    notify.success("Company name saved", next ? `Workspace is now “${next}”.` : "Company name cleared.")
  }

  const form = useForm({
    name: "",
    headName: "",
    headRole: "",
    description: "",
  })

  const officeForm = useForm({
    city: "",
    country: "",
    count: "0",
  })

  function handleNewDept() {
    form.reset()
    setEditingDept(null)
    setDialogOpen(true)
  }

  function handleEditDept(dept: Dept) {
    form.setValue("name", dept.name)
    form.setValue("headName", dept.leadName)
    form.setValue("headRole", dept.leadRole)
    form.setValue("description", dept.sub)
    setEditingDept(dept)
    setDialogOpen(true)
  }

  function handleSaveDept() {
    if (!form.values.name) return

    if (editingDept) {
      setState((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === editingDept.id
            ? {
                ...d,
                name: form.values.name,
                leadName: form.values.headName,
                leadRole: form.values.headRole || d.leadRole,
                sub: form.values.description || d.sub,
              }
            : d,
        ),
      }))
      notify.success(`Department "${form.values.name}" updated`)
    } else {
      const baseCode = generateCode(form.values.name)
      const taken = new Set(store.departments.map((d) => d.code))
      let code = baseCode
      let n = 1
      while (taken.has(code)) {
        n += 1
        code = `${baseCode}${n}`
      }
      const initials = generateInitials(form.values.headName)
      const newDept: Dept = {
        id: `d-${Math.random().toString(36).slice(2, 9)}`,
        code,
        name: form.values.name,
        sub: form.values.description,
        people: 0,
        teams: 0,
        open: 0,
        leadInit: initials,
        leadName: form.values.headName,
        leadRole: form.values.headRole || "Head",
        iconBg: "bg-foreground/20",
        iconText: "text-secondary-foreground",
      }
      setState((prev) => ({
        ...prev,
        departments: [...prev.departments, newDept],
      }))
      notify.success(`Department "${form.values.name}" created`)

    }
    setDialogOpen(false)
    setEditingDept(null)
  }

  function handleDeleteDept() {
    if (!deletingDept) return
    setState((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d.id !== deletingDept.id),
    }))
    notify.success(`Department "${deletingDept.name}" deleted`)

    setDeletingDept(null)
  }

  function handleSaveOffice() {
    if (!officeForm.values.city.trim() || !officeForm.values.country.trim()) {
      notify.error("City and country are required")
      return
    }
    const count = Math.max(0, parseInt(officeForm.values.count, 10) || 0)
    const office: Office = {
      city: officeForm.values.city.trim(),
      country: officeForm.values.country.trim(),
      count,
      fillPct: 0,
      fill: "bg-primary",
    }
    // Replace the edited row (matched on its stored values) or append a new one,
    // then re-scale every office's fill percentage to the new maximum so the
    // bars always stay proportional.
    const all = editingOffice
      ? store.offices.map((o) =>
          o.city === editingOffice.city && o.country === editingOffice.country ? office : o,
        )
      : [...store.offices, office]
    const maxCount = Math.max(1, ...all.map((o) => o.count))
    const normalized = all.map((o) => ({
      ...o,
      fillPct: Math.min(100, Math.round((o.count / maxCount) * 100)),
    }))
    setState((prev) => ({ ...prev, offices: normalized }))
    notify.success(editingOffice ? `Office "${office.city}" updated` : `Office "${office.city}" added`)
    if (!editingOffice) {

    }
    setOfficeDialogOpen(false)
    setEditingOffice(null)
    officeForm.reset({ city: "", country: "", count: "0" })
  }

  function handleDeleteOffice() {
    if (!deletingOffice) return
    setState((prev) => ({
      ...prev,
      offices: prev.offices.filter(
        (o) => !(o.city === deletingOffice.city && o.country === deletingOffice.country),
      ),
    }))
    notify.success(`Office "${deletingOffice.city}" deleted`)
    setDeletingOffice(null)
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/organization" current="Organization" accentCurrent>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="flex w-full gap-5">
          <Skeleton className="h-[108px] flex-1 rounded-2xl" />
          <Skeleton className="h-[108px] flex-1 rounded-2xl" />
          <Skeleton className="h-[108px] flex-1 rounded-2xl" />
          <Skeleton className="h-[108px] flex-1 rounded-2xl" />
        </div>
        <Skeleton className="h-[280px] w-full rounded-2xl" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[320px] w-full rounded-2xl" />
      </DashboardShell>
    )
  }

  return (
    <>
      <DashboardShell activeHref="/organization" current="Organization" accentCurrent>
        <OrgHeader
          deptCount={store.departments.length}
          peopleCount={store.departments.reduce((s, d) => s + d.people, 0)}
          onExport={() => {
            exportToCsv("departments", store.departments, [
              { key: "name", label: "Department" },
              { key: "leadName", label: "Lead" },
              { key: "people", label: "People" },
              { key: "teams", label: "Teams" },
              { key: "open", label: "Open roles" },
            ])
            notify.success("Organization exported", `${store.departments.length} departments downloaded as CSV.`)
          }}
          onNewDept={canWrite ? handleNewDept : undefined}
        />
        {canWrite ? (
          <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-3">
            <label className="flex flex-1 flex-col gap-[5px] sm:flex-row sm:items-center sm:gap-3">
              <span className="shrink-0 font-sans text-xs font-medium leading-normal text-muted-foreground">
                Company name
              </span>
              <input
                type="text"
                value={companyNameValue}
                maxLength={120}
                onChange={(e) => setCompanyDraft(e.target.value)}
                onBlur={commitCompanyName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur()
                  }
                }}
                placeholder="e.g. Acme Inc. — used on HR letters and exports"
                className="h-10 w-full rounded-lg border border-border bg-card px-3 font-sans text-[13.5px] leading-normal text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-foreground/20"
              />
            </label>
            <span className="shrink-0 font-sans text-[11.5px] leading-normal text-muted-foreground sm:w-[220px]">
              Shown on generated HR letters and the settings workspace panel.
            </span>
          </div>
        ) : null}
        <OrgStatRow
          departments={store.departments}
          offices={store.offices}
        />
        <OrgChartCard
          expanded={chartExpanded}
          onExpand={() => setChartExpanded((v) => !v)}
          orgChart={store.orgChart}
        />
        <DepartmentsSection
          departments={store.departments}
          onDeptAction={
            canWrite
              ? (id, action) => {
                  const dept = store.departments.find((d) => d.id === id)
                  if (!dept) return
                  if (action === "view") setViewingDept(dept)
                  else if (action === "edit") handleEditDept(dept)
                  else if (action === "delete") setDeletingDept(dept)
                }
              : undefined
          }
        />
        <OfficesCard
          offices={store.offices}
          onAdd={
            canWrite
              ? () => {
                  setEditingOffice(null)
                  officeForm.reset({ city: "", country: "", count: "0" })
                  setOfficeDialogOpen(true)
                }
              : undefined
          }
          onEdit={
            canWrite
              ? (office) => {
                  setEditingOffice(office)
                  officeForm.setValue("city", office.city)
                  officeForm.setValue("country", office.country)
                  officeForm.setValue("count", String(office.count))
                  setOfficeDialogOpen(true)
                }
              : undefined
          }
          onDelete={canWrite ? setDeletingOffice : undefined}
        />
      </DashboardShell>

      <ActionDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingDept(null) }}
        title={editingDept ? "Edit department" : "New department"}
        submitLabel={editingDept ? "Save changes" : "Create"}
        onSubmit={handleSaveDept}
      >
        <Field label="Department name" value={form.values.name} onChange={(v) => form.setValue("name", v)} required />
        <Field label="Department head" value={form.values.headName} onChange={(v) => form.setValue("headName", v)} required />
        <Field label="Head role" value={form.values.headRole} onChange={(v) => form.setValue("headRole", v)} />
        <TextArea label="Description" value={form.values.description} onChange={(v) => form.setValue("description", v)} placeholder="Optional description" />
      </ActionDialog>

      <ActionDialog
        open={officeDialogOpen}
        onOpenChange={(open) => { setOfficeDialogOpen(open); if (!open) setEditingOffice(null) }}
        title={editingOffice ? "Edit office" : "Add office"}
        submitLabel={editingOffice ? "Save changes" : "Add office"}
        onSubmit={handleSaveOffice}
      >
        <Field
          label="City"
          value={officeForm.values.city}
          onChange={(v) => officeForm.setValue("city", v)}
          placeholder="e.g. Austin"
          required
        />
        <Field
          label="Country / region"
          value={officeForm.values.country}
          onChange={(v) => officeForm.setValue("country", v)}
          placeholder="e.g. United States"
          required
        />
        <Field
          label="Headcount"
          type="number"
          value={officeForm.values.count}
          onChange={(v) => officeForm.setValue("count", v)}
          placeholder="0"
        />
      </ActionDialog>

      <AlertDialog open={!!deletingOffice} onOpenChange={() => setDeletingOffice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete office</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingOffice?.city}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingOffice(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOffice} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!viewingDept} onOpenChange={() => setViewingDept(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{viewingDept?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-2 flex flex-col gap-2 text-left">
                <p><strong>Code:</strong> {viewingDept?.code}</p>
                <p><strong>Head:</strong> {viewingDept?.leadName} — {viewingDept?.leadRole}</p>
                <p><strong>Teams:</strong> {viewingDept?.teams} · <strong>People:</strong> {viewingDept?.people} · <strong>Open:</strong> {viewingDept?.open}</p>
                {viewingDept?.sub ? <p><strong>Description:</strong> {viewingDept.sub}</p> : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setViewingDept(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingDept} onOpenChange={() => setDeletingDept(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingDept?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDept(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDept} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
