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
import { STORAGE_KEYS, type OrganizationStore, type Dept, defaultOrganizationStore, defaultNotificationsStore, newNotification, type NotificationsStore, type Notification } from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"
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
  const { state: store, setState, hydrated } = useMockStore<OrganizationStore>(
    STORAGE_KEYS.organization,
    () => defaultOrganizationStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }

  const [chartExpanded, setChartExpanded] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingDept, setEditingDept] = React.useState<Dept | null>(null)
  const [viewingDept, setViewingDept] = React.useState<Dept | null>(null)
  const [deletingDept, setDeletingDept] = React.useState<Dept | null>(null)

  const form = useForm({
    name: "",
    headName: "",
    headRole: "",
    description: "",
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
          d.code === editingDept.code
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
      const code = generateCode(form.values.name)
      const initials = generateInitials(form.values.headName)
      const newDept: Dept = {
        code,
        name: form.values.name,
        sub: form.values.description,
        people: 0,
        teams: 0,
        open: 0,
        leadInit: initials,
        leadName: form.values.headName,
        leadRole: form.values.headRole || "Head",
        iconBg: "bg-[#64b6ac29]",
        iconText: "text-[#3e9488]",
      }
      setState((prev) => ({
        ...prev,
        departments: [...prev.departments, newDept],
      }))
      notify.success(`Department "${form.values.name}" created`)
      addNotification({ type: "settings_changed", title: "Department added", description: `${form.values.name} department created` })
    }
    setDialogOpen(false)
    setEditingDept(null)
  }

  function handleDeleteDept() {
    if (!deletingDept) return
    setState((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d.code !== deletingDept.code),
    }))
    notify.success(`Department "${deletingDept.name}" deleted`)
    addNotification({ type: "settings_changed", title: "Department removed", description: `${deletingDept.name} department deleted` })
    setDeletingDept(null)
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/organization" current="Organization" accentCurrent>
        <Skeleton className="h-12 w-full rounded-[14px]" />
        <div className="flex w-full gap-5">
          <Skeleton className="h-[108px] flex-1 rounded-2xl" />
          <Skeleton className="h-[108px] flex-1 rounded-2xl" />
          <Skeleton className="h-[108px] flex-1 rounded-2xl" />
          <Skeleton className="h-[108px] flex-1 rounded-2xl" />
        </div>
        <Skeleton className="h-[280px] w-full rounded-[18px]" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[320px] w-full rounded-[18px]" />
      </DashboardShell>
    )
  }

  return (
    <>
      <DashboardShell activeHref="/organization" current="Organization" accentCurrent>
        <OrgHeader
          onExport={() => notify.success("Organization data exported")}
          onNewDept={handleNewDept}
        />
        <OrgStatRow
          departments={store.departments}
          offices={store.offices}
          orgChart={store.orgChart}
        />
        <OrgChartCard
          expanded={chartExpanded}
          onExpand={() => setChartExpanded((v) => !v)}
          orgChart={store.orgChart}
        />
        <DepartmentsSection
          departments={store.departments}
          onDeptAction={(id, action) => {
            const dept = store.departments.find((d) => d.code === id)
            if (!dept) return
            if (action === "view") setViewingDept(dept)
            else if (action === "edit") handleEditDept(dept)
            else if (action === "delete") setDeletingDept(dept)
          }}
        />
        <OfficesCard offices={store.offices} />
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
