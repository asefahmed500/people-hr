"use client"

import * as React from "react"

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import {
  cardToneStyles,
  defaultProjectsStore,
  DEPARTMENTS,
  statusColumns,
  type ProjectStatus,
  type ProjectTask,
  type ProjectsStore,
} from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { scopeDepartments } from "@/lib/role-scope"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Ellipsis } from "lucide-react"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Field, SelectField, useForm } from "@/components/shared/field"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { ProjectsHeader } from "@/components/projects/projects-header"
import { ProjectsKpiStrip } from "@/components/projects/projects-kpi-strip"

export function ProjectsPageClient() {
  const {
    state: store,
    setState: setStore,
    hydrated,
    error: projectsError,
    retry: retryProjects,
  } = useApiStore<ProjectsStore>(
    "/api/store/projects",
    () => defaultProjectsStore,
  )
  const { user } = useAuth()
  const canEdit = !!user
  const {
    state: employees,
    error: employeesError,
    retry: retryEmployees,
  } = useApiStore<import("@/lib/data").Employee[]>(
    "/api/store/employees",
    () => [],
  )
  const error = projectsError || employeesError
  const retry = () => {
    retryProjects()
    retryEmployees()
  }
  const employeeOptions = employees.map((e) => ({ name: e.name, role: e.role }))
  // Server write scope: employees own their tasks (ownerName), managers own
  // their department's tasks. Restrict the scope-defining fields accordingly.
  const writeDeptOptions = scopeDepartments(user, DEPARTMENTS)
  const lockOwner = !!user && user.role !== "admin"
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [deptFilter, setDeptFilter] = React.useState("all")
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const overStatus = String(over.id) as ProjectStatus
    if (!statusColumns.find((c) => c.id === overStatus)) return
    setStore((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === String(active.id) ? { ...t, status: overStatus } : t,
      ),
    }))
    const t = store.tasks.find((x) => x.id === String(active.id))
    if (t) {
      const col = statusColumns.find((c) => c.id === overStatus)
      notify.success(`${t.name} Ã¢â€ â€™ ${col?.title}`)

    }
  }

  const removeProject = (id: string) => {
    const t = store.tasks.find((x) => x.id === id)
    setStore((prev) => ({ ...prev, tasks: prev.tasks.filter((x) => x.id !== id) }))
    if (t) notify.success("Project removed", `${t.name} deleted from the board.`)
  }

  const [newProjectOpen, setNewProjectOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<ProjectTask | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectTask | null>(null)

  const activeTask = store.tasks.find((t) => t.id === activeId) ?? null

  const deptOptions = React.useMemo(() => {
    const depts = Array.from(new Set(store.tasks.map((t) => t.department)))
    return [
      { value: "all", label: "All projects" },
      ...depts.map((d) => ({ value: d, label: d })),
    ]
  }, [store.tasks])

  const visibleTasks = React.useMemo(
    () =>
      deptFilter === "all"
        ? store.tasks
        : store.tasks.filter((t) => t.department === deptFilter),
    [store.tasks, deptFilter],
  )

  const handleExport = () => {
    exportToCsv("projects", visibleTasks, [
      { key: "name", label: "Project" },
      { key: "department", label: "Department" },
      { key: "ownerName", label: "Owner" },
      { key: "status", label: "Status" },
      { key: "progress", label: "Progress %" },
      { key: "dueOrShipped", label: "Due" },
    ])
    notify.success("Projects exported", `${visibleTasks.length} projects downloaded as CSV.`)
  }

  const subtitle = `${store.tasks.length} projects across ${deptOptions.length - 1} teams Ã‚Â· ${store.tasks.filter((t) => t.status === "at-risk" || t.status === "delayed").length} flagged`

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
      <ProjectsHeader
        onNewProject={canEdit ? () => setNewProjectOpen(true) : undefined}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        deptOptions={deptOptions}
        onExport={handleExport}
        subtitle={subtitle}
      />
      <ProjectsKpiStrip tasks={visibleTasks} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {statusColumns.map((col) => (
            <KanbanColumn
              key={col.id}
              status={col.id}
              canEdit={canEdit}
              tasks={visibleTasks.filter((t) => t.status === col.id)}
              onEdit={(id) => {
                const t = store.tasks.find((x) => x.id === id)
                if (t) setEditTarget(t)
              }}
              onDelete={(id) => {
                const t = store.tasks.find((x) => x.id === id)
                setDeleteTarget(t ?? null)
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="w-[260px] rotate-2 opacity-95">
              <ProjectCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        defaultOwner={canEdit && user?.role !== "admin" && user?.name ? user.name : ""}
        departments={writeDeptOptions}
        lockOwner={lockOwner}
        employees={employeeOptions}
        onAdd={(task) => {
          setStore((prev) => ({ ...prev, tasks: [...prev.tasks, task] }))
          notify.success(`Project created: ${task.name}`)

        }}
      />
      <EditProjectDialog
        open={!!editTarget}
        onOpenChange={(o) => { if (!o) setEditTarget(null) }}
        task={editTarget}
        departments={writeDeptOptions}
        lockOwner={lockOwner}
        employees={employeeOptions}
        onSave={(updated) => {
          setStore((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)),
          }))
          notify.success("Project updated", `${updated.name} saved.`)

          setEditTarget(null)
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete project"
        description={
          deleteTarget
            ? `Delete Ã¢â‚¬Å“${deleteTarget.name}Ã¢â‚¬Â and remove it from the board? This canÃ¢â‚¬â„¢t be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) removeProject(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </>
  )
}

const TONES = ["green", "amber", "forest", "mint", "coral", "slate"] as const

const DUE_PLACEHOLDER = `Due ${new Date(Date.now() + 7 * 86400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

function EditProjectDialog({
  open,
  onOpenChange,
  task,
  onSave,
  departments = DEPARTMENTS,
  lockOwner = false,
  employees = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: ProjectTask | null
  onSave: (task: ProjectTask) => void
  departments?: readonly string[]
  lockOwner?: boolean
  employees?: { name: string; role: string }[]
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({
    name: task?.name ?? "",
    ownerName: task?.ownerName ?? "",
    department: task?.department ?? "Engineering",
    progress: String(task?.progress ?? 0),
    status: task ? (task.status as string) : "on-track",
    dueOrShipped: task?.dueOrShipped ?? "",
    priority: task?.priority ?? "medium",
  })

  React.useEffect(() => {
    if (task) {
      form.setValue("name", task.name)
      form.setValue("ownerName", task.ownerName)
      form.setValue("department", task.department)
      form.setValue("progress", String(task.progress))
      form.setValue("status", task.status)
      form.setValue("dueOrShipped", task.dueOrShipped)
      form.setValue("priority", task.priority ?? "medium")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task])

  const onSubmit = () => {
    if (!task) return
    const name = form.values.name.trim()
    const ownerName = form.values.ownerName.trim()
    const progress = Math.max(0, Math.min(100, parseInt(form.values.progress, 10) || 0))
    const errors: Record<string, string> = {}
    if (name.length < 2) errors.name = "Project name is required"
    if (ownerName.length < 2) errors.ownerName = "Pick an owner"
    if (progress < 0 || progress > 100 || Number.isNaN(progress)) errors.progress = "0Ã¢â‚¬â€œ100 only"
    if (Object.keys(errors).length > 0) {
      form.setErrors(errors as never)
      return
    }
    setSubmitting(true)
    try {
      onSave({
        ...task,
        name,
        ownerName,
        ownerInit: task.ownerInit,
        department: form.values.department,
        progress,
        status: form.values.status as ProjectStatus,
        dueOrShipped: form.values.dueOrShipped || task.dueOrShipped,
        priority: (form.values.priority || "medium") as ProjectTask["priority"],
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog width="wide"
      open={open}
      onOpenChange={onOpenChange}
      title="Edit project"
      description={task ? `Update Ã¢â‚¬Å“${task.name}Ã¢â‚¬Â.` : ""}
      submitLabel="Save changes"
      submitting={submitting}
      onSubmit={onSubmit}
    >
      <Field
        label="Project name"
        value={form.values.name}
        onChange={(v) => form.setValue("name", v)}
        placeholder="Aurora Checkout"
        required
        error={form.errors.name}
      />
      <SelectField
        label="Owner"
        value={form.values.ownerName}
        onChange={(v) => form.setValue("ownerName", v)}
        disabled={lockOwner}
        required
        error={form.errors.ownerName}
        options={
          employees.length > 0
            ? employees.map((e) => ({ value: e.name, label: `${e.name} Ã‚Â· ${e.role}` }))
            : [{ value: form.values.ownerName, label: form.values.ownerName || "No directory match" }]
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Department"
          value={form.values.department}
          onChange={(v) => form.setValue("department", v)}
          options={departments.map((d) => ({ value: d, label: d }))}
          required
        />
        <SelectField
          label="Status"
          value={form.values.status}
          onChange={(v) => form.setValue("status", v)}
          options={[
            { value: "on-track", label: "On track" },
            { value: "at-risk", label: "At risk" },
            { value: "delayed", label: "Delayed" },
            { value: "on-hold", label: "On hold" },
          ]}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Progress (%)"
          type="number"
          value={form.values.progress}
          onChange={(v) => form.setValue("progress", v)}
          error={form.errors.progress}
        />
        <SelectField
          label="Priority"
          value={form.values.priority}
          onChange={(v) => form.setValue("priority", v as "low" | "medium" | "high")}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
        />
      </div>
      <Field
        label="Due / shipped"
        value={form.values.dueOrShipped}
        onChange={(v) => form.setValue("dueOrShipped", v)}
        placeholder={DUE_PLACEHOLDER}
      />
    </ActionDialog>
  )
}

function NewProjectDialog({
  open,
  onOpenChange,
  onAdd,
  defaultOwner = "",
  departments = DEPARTMENTS,
  lockOwner = false,
  employees = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (task: ProjectTask) => void
  defaultOwner?: string
  departments?: readonly string[]
  lockOwner?: boolean
  employees?: { name: string; role: string }[]
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const [today] = React.useState(() => new Date().toISOString().slice(0, 10))
  const form = useForm({
    name: "",
    ownerName: defaultOwner,
    department: departments[0],
    dueDate: "",
    priority: "medium",
  })

  // Always-mounted dialog: reset on open so a cancelled draft doesn't leak
  // into the next session, and the department matches the writer's scope.
  React.useEffect(() => {
    if (!open) return
    form.reset({ name: "", ownerName: defaultOwner, department: departments[0], dueDate: "", priority: "medium" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = () => {
    const name = form.values.name.trim()
    const ownerName = form.values.ownerName.trim()
    const errors: Record<string, string> = {}
    if (name.length < 2) errors.name = "Project name is required"
    if (ownerName.length < 2) errors.ownerName = "Pick an owner"
    if (!form.values.dueDate) errors.dueDate = "Pick a due date"
    else if (form.values.dueDate < today) errors.dueDate = "Due date can't be in the past"
    if (Object.keys(errors).length > 0) {
      form.setErrors(errors as never)
      return
    }
    setSubmitting(true)
    try {
      const init = ownerName
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
      const tone = TONES[Math.floor(Math.random() * TONES.length)]
      const due = form.values.dueDate.split("-")
      const dueDate = new Date(Number(due[0]), Number(due[1]) - 1, Number(due[2]))
      onAdd({
        id: `p-${Date.now()}`,
        name,
        ownerName,
        ownerInit: init,
        department: form.values.department,
        progress: 0,
        dueOrShipped: `Due ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        status: "on-track",
        tone,
        priority: (form.values.priority || "medium") as ProjectTask["priority"],
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog width="wide"
      open={open}
      onOpenChange={onOpenChange}
      title="New project"
      description="Create a new project and add it to the board."
      submitLabel="Create project"
      submitting={submitting}
      onSubmit={onSubmit}
    >
      <Field
        label="Project name"
        value={form.values.name}
        onChange={(v) => form.setValue("name", v)}
        placeholder="Aurora Checkout"
        required
        error={form.errors.name}
      />
      <SelectField
        label="Owner"
        value={form.values.ownerName}
        onChange={(v) => form.setValue("ownerName", v)}
        disabled={lockOwner}
        required
        error={form.errors.ownerName}
        options={
          employees.length > 0
            ? employees.map((e) => ({ value: e.name, label: `${e.name} Ã‚Â· ${e.role}` }))
            : [{ value: form.values.ownerName, label: form.values.ownerName || "No directory match" }]
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Department"
          value={form.values.department}
          onChange={(v) => form.setValue("department", v)}
          options={departments.map((d) => ({ value: d, label: d }))}
          required
        />
        <Field
          label="Due date"
          type="date"
          value={form.values.dueDate}
          onChange={(v) => form.setValue("dueDate", v)}
          required
          error={form.errors.dueDate}
        />
      </div>
      <SelectField
        label="Priority"
        value={form.values.priority}
        onChange={(v) => form.setValue("priority", v)}
        options={[
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ]}
      />
    </ActionDialog>
  )
}

function KanbanColumn({
  status,
  tasks,
  canEdit,
  onEdit,
  onDelete,
}: {
  status: ProjectStatus
  tasks: ProjectTask[]
  canEdit: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const col = statusColumns.find((c) => c.id === status)!
  return (
    <div
      ref={setNodeRef}
      data-status={status}
      className={cn(
        "flex min-w-[240px] flex-1 flex-col gap-2.5 rounded-lg border bg-card p-3 transition-colors",
        isOver ? "border-primary" : "border-border",
      )}
    >
      <div
        className={cn(
          "mx-0 mb-1 mt-0 flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5",
          col.headerBg,
          col.headerBorder,
        )}
      >
        <span className={`size-2 shrink-0 rounded-full ${col.dot}`} />
        <span
          className={cn(
            "flex-1 font-sans text-[11px] font-semibold uppercase leading-normal tracking-[0.55px]",
            col.titleColor,
          )}
        >
          {col.title}
        </span>
        <span
          className={cn(
            "flex items-center justify-center rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold leading-normal",
            col.countChipBg,
            col.countChipText,
          )}
        >
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {tasks.length === 0 ? (
          <div
            className={cn(
              "rounded-lg border border-dashed bg-muted p-4 text-center font-sans text-[11.5px] text-muted-foreground",
              isOver ? "border-primary" : "border-border",
            )}
          >
            Drop tasks here
          </div>
        ) : null}
        {tasks.map((task) => (
          <DraggableProjectCard key={task.id} task={task} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function DraggableProjectCard({
  task,
  canEdit,
  onEdit,
  onDelete,
}: {
  task: ProjectTask
  canEdit: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canEdit,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn("touch-none", isDragging && "opacity-50")}
    >
      <ProjectCard task={task} onEdit={canEdit ? onEdit : undefined} onDelete={canEdit ? onDelete : undefined} />
    </div>
  )
}

function ProjectCard({
  task,
  onEdit,
  onDelete,
}: {
  task: ProjectTask
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const tone = cardToneStyles[task.tone]
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-[30px] shrink-0 items-center justify-center rounded-lg",
            tone.avatarBg,
          )}
        >
          <span className={cn("font-sans text-[10px] font-semibold leading-normal", tone.avatarText)}>
            {task.ownerInit}
          </span>
        </div>
        <span className="min-w-0 flex-1 font-sans text-[13px] font-semibold leading-tight text-foreground">
          {task.name}
        </span>
        {onEdit || onDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${task.name}`}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <Ellipsis className="size-3.5" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit ? (
                <DropdownMenuItem onClick={() => onEdit(task.id)}>Edit project</DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(task.id)}
                >
                  Delete project
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
        {task.department} Ã‚Â· {task.ownerName}
      </span>
      <div className="flex flex-col gap-1.5">
        <div className="flex h-1.5 w-full overflow-clip rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
            {task.dueOrShipped}
          </span>
          <span className="font-sans inline-block text-[11px] font-semibold leading-normal text-secondary-foreground">
            {task.progress}%
          </span>
        </div>
      </div>
    </div>
  )
}
