"use client"

import * as React from "react"

import {
  defaultEmployees,
  defaultBalances,
  newEmployee,
  DEPARTMENTS,
  PAY_FREQUENCIES,
  SALARY_CURRENCIES,
  formatSalary,
  type Employee,
  type PayFrequency,
} from "@/lib/data"
import { StripeReferenceField } from "@/components/employees/stripe-reference-field"
import { type LeaveStore, defaultLeaveStore } from "@/lib/data"
import { type ProjectsStore, defaultProjectsStore } from "@/lib/data"
import { type GoalsStore, defaultGoalsStore } from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { FileUpload } from "@/components/shared/file-upload"
import { scopeDepartments } from "@/lib/role-scope"
import { onAction, consumePendingAction } from "@/lib/command-actions"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type Column, type FilterChip, type SortOption } from "@/components/shared/data-table"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField, useForm } from "@/components/shared/field"
import { StoreErrorState } from "@/components/shared/store-error-state"
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
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 0), "Enter a whole amount"),
  salaryCurrency: z.enum(SALARY_CURRENCIES),
  payFrequency: z.enum(PAY_FREQUENCIES),
  salaryEffectiveDate: z.string(),
  stripeCustomerRef: z.string(),
})

export function EmployeesPageClient() {
  const {
    state: employees,
    setState: setEmployees,
    hydrated: employeesHydrated,
    error: employeesError,
    retry: retryEmployees,
  } = useApiStore<Employee[]>(
    "/api/store/employees",
    () => defaultEmployees,
  )
  const {
    state: leaveStore,
    setState: setLeaveStore,
    hydrated: leaveHydrated,
    error: leaveError,
    retry: retryLeave,
  } = useApiStore<LeaveStore>("/api/store/leave", () => defaultLeaveStore)
  const {
    state: projectsStore,
    hydrated: projectsHydrated,
    error: projectsError,
    retry: retryProjects,
  } = useApiStore<ProjectsStore>("/api/store/projects", () => defaultProjectsStore)
  const {
    state: goalsStore,
    hydrated: goalsHydrated,
    error: goalsError,
    retry: retryGoals,
  } = useApiStore<GoalsStore>("/api/store/goals", () => defaultGoalsStore)
  const { user } = useAuth()
  const canWrite = user?.role === "admin" || user?.role === "manager"
  const isAdmin = user?.role === "admin"
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
      sortable: true,
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
              {e.email || "â€”"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      className: "w-[150px] shrink-0",
      sortable: true,
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
      sortable: true,
      sortAccessor: (e) => e.role,
      render: (e) => (
        <span className="font-sans text-[13.5px] leading-normal text-secondary-foreground">
          {e.role}
        </span>
      ),
    },
    ...(isAdmin
      ? [{
          key: "compensation",
          header: "Salary",
          className: "w-[150px] shrink-0",
          render: (e: Employee) => (
            <div className="flex flex-col">
              <span className="font-sans text-[13px] leading-tight text-foreground">
                {e.salary != null
                  ? formatSalary(e.salary, e.salaryCurrency || "USD")
                  : "Not set"}
              </span>
              {e.stripeCustomerRef ? (
                <span className="font-sans text-[11px] leading-tight text-muted-foreground">
                  Stripe {e.cardLast4 ? `· ${e.cardBrand ?? "card"} ${e.cardLast4}` : "linked"}
                </span>
              ) : null}
            </div>
          ),
        }]
      : []),
    {
      key: "location",
      header: "Location",
      className: "w-[150px] shrink-0",
      sortable: true,
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
    { id: "employee", label: "Name (A-Z)", accessor: (e) => e.name },
    { id: "department", label: "Department", accessor: (e) => e.department },
    { id: "role", label: "Role", accessor: (e) => e.role },
    { id: "location", label: "Location", accessor: (e) => e.location },
  ]

  const hydrated = employeesHydrated && leaveHydrated && projectsHydrated && goalsHydrated
  const error = employeesError || leaveError || projectsError || goalsError
  const retry = () => {
    retryEmployees()
    retryLeave()
    retryProjects()
    retryGoals()
  }

  // Managers may only add/edit employees inside their own department (server
  // merge rejects anything else), so restrict the dropdown accordingly.
  const deptOptions = scopeDepartments(user, DEPARTMENTS)

  if (error) {
    // page.tsx already provides the DashboardShell for this route.
    return <StoreErrorState onRetry={retry} />
  }

  if (!hydrated) {
    return (
      <>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-[420px] w-full rounded-lg" />
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
            ...(isAdmin
              ? [
                  { key: "salary", label: "Gross salary" },
                  { key: "salaryCurrency", label: "Currency" },
                  { key: "payFrequency", label: "Pay frequency" },
                  { key: "stripeCustomerRef", label: "Stripe customer ref" },
                ]
              : []),
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
        searchPlaceholder="Search by name, role, emailâ€¦"
        filterChips={chips}
        sortOptions={sorts}
        emptyLabel="No employees match your filters."
        onRowClick={(e) => setViewEmployee(e)}
        rowMenu={(e) => [
          { label: "View profile", onSelect: () => setViewEmployee(e) },
          ...(canWrite
            ? [
                { label: "Edit", onSelect: () => setEditEmployee(e) },
                // Status is a privileged field: only admins may deactivate or
                // reactivate. Showing this to managers produced a 403 + revert.
                ...(isAdmin ? [e.status === "inactive"
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
                    }] : []),
              ]
            : []),
        ]}
      />
      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        departments={deptOptions}
        allEmployees={employees}
        isAdmin={isAdmin}
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
        isAdmin={isAdmin}
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
            <AlertDialogDescription asChild>
              <div>
                <span className="block">This deactivates {deactivateTarget?.name} from the directory. Their existing records are kept.</span>
                <span className="mt-2 flex flex-col gap-1 text-left">
                  <span>• {leaveStore.requests.filter((r) => r.employeeName === deactivateTarget?.name).length} leave request(s)</span>
                  <span>• {projectsStore.tasks.filter((t) => t.ownerName === deactivateTarget?.name).length} project(s)</span>
                  <span>• {goalsStore.objectives.filter((o) => o.ownerName === deactivateTarget?.name).length} objective(s)</span>
                </span>
              </div>
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
                  // Cancel any pending leave requests for the deactivated employee
                  setLeaveStore?.((prev) => ({
                    ...prev,
                    requests: prev.requests.map((r) =>
                      // Match by stable id only. Matching on display name could
                      // decline a different person's request when two employees
                      // share a name.
                      r.status === "pending" && r.employeeId === deactivateTarget.id
                        ? { ...r, status: "declined" as const }
                        : r,
                    ),
                  }))
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
        <SheetContent side="right" className="w-full gap-4 border-l border-border bg-card p-4 sm:max-w-[400px]">
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
                  <span className="font-sans text-[12px] text-muted-foreground">{viewEmployee.email || "â€”"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted p-4">
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
                  <span className="font-sans text-[13px] font-medium text-foreground">{viewEmployee.phone || "â€”"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Employment type</span>
                  <span className="font-sans text-[13px] font-medium capitalize text-foreground">{viewEmployee.employmentType ?? "full-time"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-muted-foreground">Reporting manager</span>
                  <span className="font-sans text-[13px] font-medium text-foreground">{viewEmployee.reportingManager || "â€”"}</span>
                </div>
              </div>
              {isAdmin ? (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted p-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans text-[11px] text-muted-foreground">Gross salary</span>
                    <span className="font-sans text-[13px] font-medium text-foreground">
                      {viewEmployee.salary != null
                        ? formatSalary(viewEmployee.salary, viewEmployee.salaryCurrency || "USD")
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans text-[11px] text-muted-foreground">Pay frequency</span>
                    <span className="font-sans text-[13px] font-medium capitalize text-foreground">
                      {viewEmployee.payFrequency ?? "monthly"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans text-[11px] text-muted-foreground">Effective from</span>
                    <span className="font-sans text-[13px] font-medium text-foreground">
                      {viewEmployee.salaryEffectiveDate || "â€”"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans text-[11px] text-muted-foreground">Stripe reference</span>
                    <span className="font-sans text-[13px] font-medium text-foreground">
                      {viewEmployee.stripeCustomerRef || "Not linked"}
                    </span>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted p-4">
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
  isAdmin = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd?: (emp: Employee) => void
  editEmployee?: Employee
  onEdit?: (emp: Employee) => void
  departments?: readonly string[]
  allEmployees?: Employee[]
  isAdmin?: boolean
}) {
  const isEdit = !!editEmployee
  const { user } = useAuth()
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
    salaryCurrency: editEmployee?.salaryCurrency ?? "USD",
    payFrequency: editEmployee?.payFrequency ?? "monthly",
    salaryEffectiveDate: editEmployee?.salaryEffectiveDate ?? new Date().toISOString().slice(0, 10),
    stripeCustomerRef: editEmployee?.stripeCustomerRef ?? "",
    cardBrand: editEmployee?.cardBrand ?? "",
    cardLast4: editEmployee?.cardLast4 ?? "",
    attachments: editEmployee?.attachments ?? [],
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
      salaryCurrency: "USD",
      payFrequency: "monthly",
      salaryEffectiveDate: new Date().toISOString().slice(0, 10),
      stripeCustomerRef: "",
      cardBrand: "",
      cardLast4: "",
      attachments: [],
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
      form.setValue("salaryCurrency", editEmployee.salaryCurrency ?? "USD")
      form.setValue("payFrequency", editEmployee.payFrequency ?? "monthly")
      form.setValue("salaryEffectiveDate", editEmployee.salaryEffectiveDate ?? new Date().toISOString().slice(0, 10))
      form.setValue("stripeCustomerRef", editEmployee.stripeCustomerRef ?? "")
      form.setValue("cardBrand", editEmployee.cardBrand ?? "")
      form.setValue("cardLast4", editEmployee.cardLast4 ?? "")
      form.setValue("attachments", editEmployee.attachments ?? [])
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
    // Duplicate email guard â€” emails are the identity used by role-scoping.
    const email = parsed.data.email.toLowerCase()
    const duplicate =
      email !== "" &&
      allEmployees.some((e) => e.email.toLowerCase() === email && e.id !== editEmployee?.id)
    if (duplicate) {
      form.setErrors({ email: "An employee with this email already exists" } as never)
      return
    }
    // Compensation is privileged: managers keep the stored values, admins can
    // change them. Stripe refs are ids + display metadata, never card numbers.
    const compensation = {
      salaryCurrency: parsed.data.salaryCurrency,
      payFrequency: parsed.data.payFrequency,
      salaryEffectiveDate: parsed.data.salaryEffectiveDate || undefined,
      stripeCustomerRef: form.values.stripeCustomerRef?.trim() || undefined,
      cardBrand: form.values.cardBrand || undefined,
      cardLast4: form.values.cardLast4 || undefined,
    }
    setSubmitting(true)
    try {
      if (isEdit && editEmployee && onEdit) {
        onEdit({
          ...editEmployee,
          name: parsed.data.name,
          email: parsed.data.email,
          // Employment fields are admin-only; managers cannot change them.
          role: isAdmin ? parsed.data.role : editEmployee.role,
          department: parsed.data.department as Employee["department"],
          location: parsed.data.location,
          status: isAdmin ? parsed.data.status : editEmployee.status,
          phone: parsed.data.phone || undefined,
          employmentType: parsed.data.employmentType,
          reportingManager: parsed.data.reportingManager || undefined,
          salary: isAdmin
            ? (parsed.data.salary === "" ? undefined : Number(parsed.data.salary))
            : editEmployee.salary,
          ...(isAdmin ? compensation : {}),
          attachments: form.values.attachments,
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
            ...compensation,
            attachments: form.values.attachments,
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
      description={isEdit ? `Update ${editEmployee?.name}'s details.` : "Create a directory entry with personnel documents. No invite email is sent."}
      submitLabel={isEdit ? "Save changes" : "Add employee"}
      submitting={submitting}
      width="wide"
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-3">
        {isAdmin ? (
          <Field
            label="Role"
            value={form.values.role}
            onChange={(v) => form.setValue("role", v)}
            placeholder="Product Designer"
            required
            error={form.errors.role}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-sans text-xs font-medium text-muted-foreground">Role</span>
            <span className="truncate font-sans text-[13.5px] text-foreground">{form.values.role}</span>
          </div>
        )}
        <SelectField
          label="Department"
          value={form.values.department}
          onChange={(v) => form.setValue("department", v)}
          options={departments.map((d) => ({ value: d, label: d }))}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Location"
          value={form.values.location}
          onChange={(v) => form.setValue("location", v)}
          placeholder="Barcelona, ES"
          required
          error={form.errors.location}
        />
        {isAdmin ? (
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
        ) : (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-sans text-xs font-medium text-muted-foreground">Status</span>
            <span className="font-sans text-[13.5px] text-foreground">{form.values.status}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      {isAdmin ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Gross salary"
            type="number"
            value={form.values.salary ?? ""}
            onChange={(v) => form.setValue("salary", v)}
            placeholder="e.g. 5200 - used by payroll"
            error={form.errors.salary}
          />
          <SelectField
            label="Currency"
            value={form.values.salaryCurrency ?? "USD"}
            onChange={(v) => form.setValue("salaryCurrency", v)}
            options={SALARY_CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
          <SelectField
            label="Pay frequency"
            value={form.values.payFrequency ?? "monthly"}
            onChange={(v) => form.setValue("payFrequency", v as PayFrequency)}
            options={PAY_FREQUENCIES.map((f) => ({
              value: f,
              label: f.charAt(0).toUpperCase() + f.slice(1).replace("-", " "),
            }))}
          />
          <Field
            label="Salary effective date"
            type="date"
            value={form.values.salaryEffectiveDate ?? ""}
            onChange={(v) => form.setValue("salaryEffectiveDate", v)}
          />
        </div>
      ) : null}
      {isAdmin ? (
        <StripeReferenceField
          value={form.values.stripeCustomerRef ?? ""}
          onChange={(v) => form.setValue("stripeCustomerRef", v)}
          onVerified={({ cardBrand, cardLast4 }) => {
            form.setValue("cardBrand", cardBrand ?? "")
            form.setValue("cardLast4", cardLast4 ?? "")
          }}
        />
      ) : null}
      <SelectField
        label="Reporting manager"
        value={form.values.reportingManager ?? ""}
        onChange={(v) => form.setValue("reportingManager", v)}
        options={[
          { value: "", label: "No manager (individual contributor)" },
          ...allEmployees
            .filter((e) => e.id !== editEmployee?.id && e.status !== "inactive")
            .map((e) => ({ value: e.name, label: `${e.name} Â· ${e.role}` })),
        ]}
      />
      {/* Personnel file: identity document and supporting evidence. */}
      <FileUpload
        label="Personnel documents"
        value={form.values.attachments ?? []}
        onChange={(files) => form.setValue("attachments", files)}
        requiredKinds={["identity"]}
        optionalKinds={["contract", "certificate", "supporting", "other"]}
        maxFiles={10}
        uploadedBy={user?.id}
      />
    </ActionDialog>
  )
}
