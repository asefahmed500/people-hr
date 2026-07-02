"use client"

import * as React from "react"

import { STORAGE_KEYS, defaultEmployees, newEmployee, defaultNotificationsStore, newNotification, type Employee, type NotificationsStore, type Notification } from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"
import { onAction } from "@/lib/command-actions"
import { notify } from "@/lib/toast"
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

const DEPARTMENTS = ["Engineering", "Design", "Product", "Sales", "Marketing", "People", "Research", "Finance"] as const

const employeeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.string().min(2, "Role is required"),
  department: z.string().min(1, "Pick a department"),
  location: z.string().min(2, "Location is required"),
})

export function EmployeesPageClient() {
  const { state: employees, setState: setEmployees } = useMockStore<Employee[]>(
    STORAGE_KEYS.employees,
    () => defaultEmployees,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }
  const [addOpen, setAddOpen] = React.useState(false)
  const [editEmployee, setEditEmployee] = React.useState<Employee | null>(null)
  const [deactivateTarget, setDeactivateTarget] = React.useState<Employee | null>(null)
  const [viewEmployee, setViewEmployee] = React.useState<Employee | null>(null)

  React.useEffect(
    () =>
      onAction((id) => {
        if (id === "add-employee") setAddOpen(true)
      }),
    [],
  )

  const columns: Column<Employee>[] = [
    {
      key: "employee",
      header: "Employee",
      className: "min-w-0 flex-1",
      render: (e) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#64b6ac29]">
            <span className="font-sans text-[12.5px] font-semibold leading-normal text-[#3e9488]">
              {e.initials}
            </span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-sans text-[13px] font-semibold leading-tight text-[#1f2a26]">
              {e.name}
            </span>
            <span className="font-sans text-[12.5px] leading-tight text-[#9aa39c]">
              {e.email}
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
        <span className="inline-block w-fit rounded-full bg-[#f1efea] px-2.5 py-1 font-sans text-[11.5px] font-medium leading-normal text-[#5b655e]">
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
        <span className="font-sans text-[13.5px] leading-normal text-[#42504a]">
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
        <span className="font-sans text-[13.5px] leading-normal text-[#6b7770]">
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
  ]

  const sorts: SortOption<Employee>[] = [
    { id: "name", label: "Name (A–Z)", accessor: (e) => e.name },
    { id: "department", label: "Department", accessor: (e) => e.department },
    { id: "location", label: "Location", accessor: (e) => e.location },
  ]

  return (
    <>
      <DirectoryHeader onAddClick={() => setAddOpen(true)} />
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
        onRowClick={(e) => notify.info(`Opening ${e.name}`)}
        rowMenu={(e) => [
          { label: "View profile", onSelect: () => setViewEmployee(e) },
          { label: "Edit", onSelect: () => setEditEmployee(e) },
          {
            label: "Deactivate",
            danger: true,
            onSelect: () => setDeactivateTarget(e),
          },
        ]}
      />
      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(emp) => {
          setEmployees((prev) => [emp, ...prev])
          notify.success(`${emp.name} added`)
          addNotification({ type: "employee_added", title: "Employee added", description: `${emp.name} added to directory`, href: "/employees" })
        }}
      />
      <AddEmployeeDialog
        open={!!editEmployee}
        onOpenChange={(o) => { if (!o) setEditEmployee(null) }}
        editEmployee={editEmployee ?? undefined}
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
              This will remove {deactivateTarget?.name} from the active directory. This action can be undone later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeactivateTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateTarget) {
                  setEmployees((prev) => prev.filter((p) => p.id !== deactivateTarget.id))
                  notify.success(`${deactivateTarget.name} deactivated`)
                  addNotification({ type: "employee_deactivated", title: "Employee deactivated", description: `${deactivateTarget.name} was deactivated` })
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
        <SheetContent side="right" className="w-full gap-4 border-l border-[#ece9e2] bg-white p-6 sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="font-display text-[18px] font-semibold text-[#1f2a26]">
              {viewEmployee?.name}
            </SheetTitle>
            <SheetDescription className="font-sans text-[12.5px] text-[#8a948d]">
              Employee profile details
            </SheetDescription>
          </SheetHeader>
          {viewEmployee && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-[#64b6ac29]">
                  <span className="font-sans text-[16px] font-semibold leading-normal text-[#3e9488]">
                    {viewEmployee.initials}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-[13px] font-semibold text-[#1f2a26]">{viewEmployee.name}</span>
                  <span className="font-sans text-[12px] text-[#8a948d]">{viewEmployee.email}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-[#8a948d]">Role</span>
                  <span className="font-sans text-[13px] font-medium text-[#1f2a26]">{viewEmployee.role}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-[#8a948d]">Department</span>
                  <span className="font-sans text-[13px] font-medium text-[#1f2a26]">{viewEmployee.department}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-[#8a948d]">Location</span>
                  <span className="font-sans text-[13px] font-medium text-[#1f2a26]">{viewEmployee.location}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[11px] text-[#8a948d]">Status</span>
                  <span className="font-sans text-[13px] font-medium text-[#1f2a26]">{viewEmployee.status}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-4">
                <span className="font-sans text-[11px] text-[#8a948d]">Employee ID</span>
                <span className="font-sans text-[13px] font-medium text-[#1f2a26]">{viewEmployee.id}</span>
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
    active: { bg: "bg-[#3bb2731f]", dot: "bg-[#3bb273]", text: "text-[#2e9160]", label: "Active" },
    leave: { bg: "bg-[#f4a26129]", dot: "bg-[#f4a261]", text: "text-[#c67934]", label: "On leave" },
    remote: { bg: "bg-[#64b6ac24]", dot: "bg-[#64b6ac]", text: "text-[#3e9488]", label: "Remote" },
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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd?: (emp: Employee) => void
  editEmployee?: Employee
  onEdit?: (emp: Employee) => void
}) {
  const isEdit = !!editEmployee
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({
    name: editEmployee?.name ?? "",
    email: editEmployee?.email ?? "",
    role: editEmployee?.role ?? "",
    department: (editEmployee?.department as string) ?? "Engineering",
    location: editEmployee?.location ?? "",
    status: (editEmployee?.status ?? "active") as Employee["status"],
  })

  React.useEffect(() => {
    if (editEmployee) {
      form.setValue("name", editEmployee.name)
      form.setValue("email", editEmployee.email)
      form.setValue("role", editEmployee.role)
      form.setValue("department", editEmployee.department)
      form.setValue("location", editEmployee.location)
      form.setValue("status", editEmployee.status)
    }
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
          status: form.values.status,
        })
      } else if (onAdd) {
        onAdd(
          newEmployee({
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            department: parsed.data.department as Employee["department"],
            location: parsed.data.location,
            status: form.values.status,
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
          options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
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
          ]}
        />
      </div>
    </ActionDialog>
  )
}
