"use client"

import * as React from "react"

import { defaultEmployees, defaultBalances, newEmployee, DEPARTMENTS, type Employee } from "@/lib/data"
import { type LeaveStore, defaultLeaveStore } from "@/lib/data"
import { type ProjectsStore, defaultProjectsStore } from "@/lib/data"
import { type GoalsStore, defaultGoalsStore } from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { scopeDepartments } from "@/lib/role-scope"
import { onAction, consumePendingAction } from "@/lib/command-actions"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type Column, type FilterChip, type SortOption } from "@/components/shared/data-table"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField, useForm } from "@/components/shared/field"
import { DirectoryHeader } from "@/components/employees/directory-header"
import { DirectoryStatChips } from "@/components/employees/directory-stat-chips"
import { cn } from "@/lib/utils"
import { z } from "zod"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const employeeSchema = z.object({
  name: z
    .string()
    .min(2, "Name is required")
    .regex(/^[a-zA-Z][a-zA-Z .'-]*$/, "Name can only contain letters, spaces and ' - ."),
  // Empty is allowed (e.g. hires added via recruitment); when present it must
  // be a valid email.
  email: z
    .string()
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
  role: z.string().min(2, "Role is required"),
  department: z.string().min(1, "Pick a department"),
  location: z.string().min(2, "Location is required"),
  status: z.enum(["active", "leave", "remote", "inactive"]),
  phone: z
    .string()
    .refine((v) => v === "" || /^[+]?[\d\s()-]{7,18}$/.test(v), "Enter a valid phone number")
    .optional(),
  employmentType: z.enum(["full-time", "part-time", "contract", "intern"]),
  reportingManager: z.string().optional(),
  salary: z
    .string()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 0), "Enter a whole dollar amount"),
})

export function EmployeesPageClient() {
  const { state: employees, setState: setEmployees, hydrated: employeesHydrated } = useApiStore<Employee[]>(
    "/api/store/employees",
    () => defaultEmployees,
  )
  const { state: leaveStore, setState: setLeaveStore, hydrated: leaveHydrated } = useApiStore<LeaveStore>("/api/store/leave", () => defaultLeaveStore)
  const { state: projectsStore, hydrated: projectsHydrated } = useApiStore<ProjectsStore>("/api/store/projects", () => defaultProjectsStore)
  const { state: goalsStore, hydrated: goalsHydrated } = useApiStore<GoalsStore>("/api/store/goals", () => defaultGoalsStore)
  const { user } = useAuth()
  const canWrite = user?.role === "admin" || user?.role === "manager"
  const [addOpen, setAddOpen] = React.useState(false)
  const [editEmployee, setEditEmployee] = React.useState<Employee | null>(null)
  const [deactivateTarget, setDeactivateTarget] = React.useState<Employee | null>(null)
  const [viewEmployee, setViewEmployee] = React.useState<Employee | null>(null)

  React.useEffect(() => {
    const off = onAction((id) => {
      if (id === "add-employee" && canWrite) setAddOpen(true)
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (canWrite && consumePendingAction("add-employee")) setAddOpen(true)
    return off
  }, [canWrite])

  const columns: Column<Employee>[] = [
    {
      key: "employee",
      header: "Employee",
      className: "min-w-0 flex-1",
      render: (e) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-foreground/20">
            <span className="font-sans text-[12.5px] font-semibold leading-normal text-secondary-foreground">
              {e.initials}
            </span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-sans text-[13px] font-semibold leading-tight text-foreground">
              {e.name}
            </span>
            <span className="font-sans text-[12.5px] leading-tight text-muted-foreground">
              {e.email || "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      className: "w-[150px] shrink-0",
      sortAccessor: (e) => e.department,
      render: (e) => (
        <span className="inline-block w-fit rounded-full bg-muted px-2.5 py-1 font-sans text-[11.5px] font-medium leading-normal text-secondary-foreground">
          {e.department}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "w-[200px] shrink-0",
      sortAccessor: (e) => e.role,
      render: (e) => (
        <span className="font-sans text-[13.5px] leading-normal text-secondary-foreground">
          {e.role}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      className: "w-[150px] shrink-0",
      sortAccessor: (e) => e.location,
      render: (e) => (
        <span className="font-sans text-[13.5px] leading-normal text-secondary-foreground">
          {e.location}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[120px] shrink-0",
      render: (e) => <StatusPill status={e.status} />,
    },
  ]

  const chips: FilterChip<Employee>[] = [
    { id: "all", label: "All", matcher: () => true },
    { id: "active", label: "Active", matcher: (e) => e.status === "active" },
    { id: "leave", label: "On leave", matcher: (e) => e.status === "leave" },
    { id: "remote", label: "Remote", matcher: (e) => e.status === "remote" },
    { id: "inactive", label: "Inactive", matcher: (e) => e.status === "inactive" },
  ]

  const sorts: SortOption<Employee>[] = [
    { id: "name", label: "Name (A–Z)", accessor: (e) => e.name },
    { id: "department", label: "Department", accessor: (e) => e.department },
    { id: "location", label: "Location", accessor: (e) => e.location },
  ]

  const hydrated = employeesHydrated && leaveHydrated && projectsHydrated && goalsHydrated

  // Managers may only add/edit employees inside their own department (server
  // merge rejects anything else), so restrict the dropdown accordingly.
  const deptOptions = scopeDepartments(user, DEPARTMENTS)

  if (!hydrated) {
    return (
      <>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </>
    )
  }

  return (
    <>
      <DirectoryHeader
        onAddClick={canWrite ? () => setAddOpen(true) : undefined}
        onExport={() => {
          exportToCsv("employees", employees, [
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "role", label: "Role" },
            { key: "department", label: "Department" },
            { key: "employmentType", label: "Employment type" },
            { key: "reportingManager", label: "Reporting manager" },
            { key: "location", label: "Location" },
            { key: "status", label: "Status" },
          ])
          notify.success("Directory exported", `${employees.length} employees downloaded as CSV.`)
        }}
      />
      <DirectoryStatChips employees={employees} />
      <DataTable
        rows={employees}
        columns={columns}
        getRowId={(e) => e.id}
        searchKeys={["name", "email", "role", "location"]}
        searchPlaceholder="Search by name, role, email…"
        filterChips={chips}
        sortOptions={sorts}
        emptyLabel="No employees match your filters."
        onRowClick={(e) => setViewEmployee(e)}
        rowMenu={(e) => [
          { label: "View profile", onSelect: () => setViewEmployee(e) },
          ...(canWrite
            ? [
                { label: "Edit", onSelect: () => setEditEmployee(e) },
                e.status === "inactive"
                  ? {
                      label: "Reactivate",
                      onSelect: () => {
                        setEmployees((prev) =>
                          prev.map((p) => (p.id === e.id ? { ...p, status: "active" as const } : p)),
                        )
                        notify.success(`${e.name} reactivated`)

                      },
                    }
                  : {
                      label: "Deactivate",
                      danger: true,
                      onSelect: () => setDeactivateTarget(e),
                    },
              ]
            : []),
        ]}
      />
      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        departments={deptOptions}
        allEmployees={employees}
        onAdd={(emp) => {
          setEmployees((prev) => [emp, ...prev])
          // Every new directory entry gets a leave balance so the leave module
          // works for them immediately (server merge allows admins and
          // managers-in-their-dept to seed a balance row).
          setLeaveStore((prev) => ({
            ...prev,
            balances: { ...prev.balances, [emp.id]: defaultBalances },
          }))
          notify.success(`${emp.name} added`)

        }}
      />
      <AddEmployeeDialog
        open={!!editEmployee}
        onOpenChange={(o) => { if (!o) setEditEmployee(null) }}
        editEmployee={editEmployee ?? undefined}
        departments={deptOptions}
        allEmployees={employees}
        onEdit={(emp) => {
          setEmployees((prev) => prev.map((p) => (p.id === emp.id ? emp : p)))
          notify.success(`${emp.name} updated`)

          setEditEmployee(null)
        }}
      />
      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => { if (!o) setDeactivateTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              <p>This deactivates {deactivateTarget?.name} from the directory. Their existing records are kept.</p>
              <ul className="mt-2 flex flex-col gap-1 text-left">
                <li>• {leaveStore.requests.filter((r) => r.employeeName === deactivateTarget?.name).length} leave request(s)</li>
                <li>• {projectsStore.tasks.filter((t) => t.ownerName === deactivateTarget?.name).length} project(s)</li>
                <li>• {goalsStore.objectives.filter((o) => o.ownerName === deactivateTarget?.name).length} objective(s)</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeactivateTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateTarget) {
                  setEmployees((prev) =>
                    prev.map((p) =>
                      p.id === deactivateTarget.id ? { ...p, status: "inactive" as const } : p,
                    ),
                  )
                  notify.success(`${deactivateTarget.name} deactivated`)

                }
                setDeactivateTarget(null)
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet open={!!viewEmployee} onOpenChange={(o) => { if (!o) setViewEmployee(null) }}>
        <SheetContent side="right" className="w-full gap-4 border-l border-border bg-card p-6 sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-h4">
              {viewEmployee?.name}
            </SheetTitle>
            <SheetDescription className="font-sans text-[12.5px] text-muted-foreground">
              Employee profile details
            </SheetDescription>
          </SheetHeader>
          {viewEmployee && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-foreground/20">
                  <span className="font-sans text-[16px] font-semibold leading-normal text-secondary-foreground">
                    {viewEmployee.initials}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[13px] font-semibold text-foreground">{viewEmployee.name}</span>
                  <span className="font-sans text-[12px] text-muted-foreground">{viewEmployee.email || "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Role</span>
                  <span className="font-sans text-[13px] font-medium text-foreground">{viewEmployee.role}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Department</span>
                  <span className="font-sans text-[13px] font-medium text-foreground">{viewEmployee.department}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Location</span>
                  <span className="font-sans text-[13px] font-medium text-foreground">{viewEmployee.location}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Status</span>
                  <span className="font-sans text-[13px] font-medium capitalize text-foreground">{viewEmployee.status}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Phone</span>
                  <span className="font-sans text-[13px] font-medium text-foreground">{viewEmployee.phone || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Employment type</span>
                  <span className="font-sans text-[13px] font-medium capitalize text-foreground">{viewEmployee.employmentType ?? "full-time"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Reporting manager</span>
                  <span className="font-sans text-[13px] font-medium text-foreground">{viewEmployee.reportingManager || "—"}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted p-4">
                <span className="font-sans text-[11px] text-muted-foreground">Employee ID</span>
                <span className="font-sans text-[13px] font-medium text-foreground">{viewEmployee.id}</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function StatusPill({ status }: { status: Employee["status"] }) {
  const styles = {
    active: { bg: "bg-foreground/10", dot: "bg-secondary-foreground", text: "text-secondary-foreground", label: "Active" },
    leave: { bg: "bg-foreground/10", dot: "bg-muted-foreground", text: "text-secondary-foreground", label: "On leave" },
    remote: { bg: "bg-foreground/10", dot: "bg-secondary-foreground", text: "text-secondary-foreground", label: "Remote" },
    inactive: { bg: "bg-muted", dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Inactive" },
  } as const
  const s = styles[status]
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-semibold leading-normal",
        s.bg,
        s.text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}

function AddEmployeeDialog({
  open,
  onOpenChange,
  onAdd,
  editEmployee,
  onEdit,
  departments = DEPARTMENTS,
  allEmployees = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd?: (emp: Employee) => void
  editEmployee?: Employee
  onEdit?: (emp: Employee) => void
  departments?: readonly string[]
  allEmployees?: Employee[]
}) {
  const isEdit = !!editEmployee
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({
    name: editEmployee?.name ?? "",
    email: editEmployee?.email ?? "",
    role: editEmployee?.role ?? "",
    department: (editEmployee?.department as string) ?? departments[0],
    location: editEmployee?.location ?? "",
    status: (editEmployee?.status ?? "active") as Employee["status"],
    phone: editEmployee?.phone ?? "",
    employmentType: editEmployee?.employmentType ?? "full-time",
    reportingManager: editEmployee?.reportingManager ?? "",
    salary: editEmployee?.salary != null ? String(editEmployee.salary) : "",
  })

  // Always-mounted dialog: clear the add form each time it opens so a
  // cancelled draft doesn't leak into the next session.
  React.useEffect(() => {
    if (!open || editEmployee) return
    form.reset({
      name: "",
      email: "",
      role: "",
      department: departments[0],
      location: "",
      status: "active",
      phone: "",
      employmentType: "full-time",
      reportingManager: "",
      salary: "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Sync the form whenever an edit target is selected.
  React.useEffect(() => {
    if (editEmployee) {
      form.setValue("name", editEmployee.name)
      form.setValue("email", editEmployee.email)
      form.setValue("role", editEmployee.role)
      form.setValue("department", editEmployee.department)
      form.setValue("location", editEmployee.location)
      form.setValue("status", editEmployee.status)
      form.setValue("phone", editEmployee.phone ?? "")
      form.setValue("employmentType", editEmployee.employmentType ?? "full-time")
      form.setValue("reportingManager", editEmployee.reportingManager ?? "")
      form.setValue("salary", editEmployee.salary != null ? String(editEmployee.salary) : "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEmployee])

  const onSubmit = () => {
    const parsed = employeeSchema.safeParse(form.values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message
      }
      form.setErrors(fieldErrors as never)
      return
    }
    // Duplicate email guard — emails are the identity used by role-scoping.
    const email = parsed.data.email.toLowerCase()
    const duplicate =
      email !== "" &&
      allEmployees.some((e) => e.email.toLowerCase() === email && e.id !== editEmployee?.id)
    if (duplicate) {
      form.setErrors({ email: "An employee with this email already exists" } as never)
      return
    }
    setSubmitting(true)
    try {
      if (isEdit && editEmployee && onEdit) {
        onEdit({
          ...editEmployee,
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          department: parsed.data.department as Employee["department"],
          location: parsed.data.location,
          status: parsed.data.status,
          phone: parsed.data.phone || undefined,
          employmentType: parsed.data.employmentType,
          reportingManager: parsed.data.reportingManager || undefined,
          salary: parsed.data.salary === "" ? undefined : Number(parsed.data.salary),
        })
      } else if (onAdd) {
        onAdd(
          newEmployee({
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            department: parsed.data.department as Employee["department"],
            location: parsed.data.location,
            status: parsed.data.status,
            phone: parsed.data.phone || undefined,
            employmentType: parsed.data.employmentType,
            reportingManager: parsed.data.reportingManager || undefined,
            salary: parsed.data.salary === "" ? undefined : Number(parsed.data.salary),
          }),
        )
      }
      form.reset()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit employee" : "Add employee"}
      description={isEdit ? `Update ${editEmployee?.name}'s details.` : "Create a new directory entry. They'll receive an invite via email."}
      submitLabel={isEdit ? "Save changes" : "Add employee"}
      submitting={submitting}
      onSubmit={onSubmit}
    >
      <Field
        label="Full name"
        value={form.values.name}
        onChange={(v) => form.setValue("name", v)}
        placeholder="Jane Doe"
        required
        error={form.errors.name}
      />
      <Field
        label="Email"
        type="email"
        value={form.values.email}
        onChange={(v) => form.setValue("email", v)}
        placeholder="jane.doe@northwind.co"
        required
        error={form.errors.email}
      />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field
          label="Role"
          value={form.values.role}
          onChange={(v) => form.setValue("role", v)}
          placeholder="Product Designer"
          required
          error={form.errors.role}
        />
        <SelectField
          label="Department"
          value={form.values.department}
          onChange={(v) => form.setValue("department", v)}
          options={departments.map((d) => ({ value: d, label: d }))}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field
          label="Location"
          value={form.values.location}
          onChange={(v) => form.setValue("location", v)}
          placeholder="Barcelona, ES"
          required
          error={form.errors.location}
        />
        <SelectField
          label="Status"
          value={form.values.status}
          onChange={(v) => form.setValue("status", v as Employee["status"])}
          options={[
            { value: "active", label: "Active" },
            { value: "leave", label: "On leave" },
            { value: "remote", label: "Remote" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field
          label="Phone"
          type="text"
          value={form.values.phone ?? ""}
          onChange={(v) => form.setValue("phone", v)}
          placeholder="+34 600 123 456"
          error={form.errors.phone}
        />
        <SelectField
          label="Employment type"
          value={form.values.employmentType ?? "full-time"}
          onChange={(v) => form.setValue("employmentType", v as Exclude<Employee["employmentType"], undefined>)}
          options={[
            { value: "full-time", label: "Full-time" },
            { value: "part-time", label: "Part-time" },
            { value: "contract", label: "Contract" },
            { value: "intern", label: "Intern" },
          ]}
        />
      </div>
      <Field
        label="Monthly gross salary (USD)"
        type="number"
        value={form.values.salary ?? ""}
        onChange={(v) => form.setValue("salary", v)}
        placeholder="e.g. 5200 — used by payroll"
        error={form.errors.salary}
      />
      <SelectField
        label="Reporting manager"
        value={form.values.reportingManager ?? ""}
        onChange={(v) => form.setValue("reportingManager", v)}
        options={[
          { value: "", label: "No manager (individual contributor)" },
          ...allEmployees
            .filter((e) => e.id !== editEmployee?.id && e.status !== "inactive")
            .map((e) => ({ value: e.name, label: `${e.name} · ${e.role}` })),
        ]}
      />
    </ActionDialog>
  )
}
