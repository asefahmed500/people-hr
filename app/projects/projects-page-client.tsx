"use client"

import * as React from "react"

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"

import {
  STORAGE_KEYS,
  cardToneStyles,
  defaultProjectsStore,
  defaultNotificationsStore,
  newNotification,
  statusColumns,
  type ProjectStatus,
  type ProjectTask,
  type ProjectsStore,
  type NotificationsStore,
  type Notification,
} from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField, useForm } from "@/components/shared/field"
import { ProjectsHeader } from "@/components/projects/projects-header"
import { ProjectsKpiStrip } from "@/components/projects/projects-kpi-strip"

export function ProjectsPageClient() {
  const { state: store, setState: setStore } = useMockStore<ProjectsStore>(
    STORAGE_KEYS.projects,
    () => defaultProjectsStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
      notify.success(`${t.name} → ${col?.title}`)
    }
  }

  const [newProjectOpen, setNewProjectOpen] = React.useState(false)

  const activeTask = store.tasks.find((t) => t.id === activeId) ?? null

  return (
    <>
      <ProjectsHeader
        onNewProject={() => setNewProjectOpen(true)}
        onExport={() => notify.success("Projects exported")}
        onFilter={() => notify.info("Filter projects")}
      />
      <ProjectsKpiStrip tasks={store.tasks} />
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
              tasks={store.tasks.filter((t) => t.status === col.id)}
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
        onAdd={(task) => {
          setStore((prev) => ({ ...prev, tasks: [...prev.tasks, task] }))
          notify.success(`Project created: ${task.name}`)
          addNotification({ type: "project_created", title: "Project created", description: `${task.name} project added`, href: "/projects" })
        }}
      />
    </>
  )
}

const PROJECT_DEPARTMENTS = ["Engineering", "Design", "Product", "Sales", "Marketing", "People", "Research", "Finance"]

const TONES = ["green", "amber", "forest", "mint", "coral", "slate"] as const

function NewProjectDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (task: ProjectTask) => void
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({
    name: "",
    ownerName: "",
    department: "Engineering",
    dueDate: "",
  })

  const onSubmit = () => {
    if (!form.values.name.trim() || !form.values.ownerName.trim() || !form.values.dueDate.trim()) {
      notify.error("Please fill in all required fields")
      return
    }
    setSubmitting(true)
    try {
      const init = form.values.ownerName
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
      const tone = TONES[Math.floor(Math.random() * TONES.length)]
      onAdd({
        id: `p-${Date.now()}`,
        name: form.values.name.trim(),
        ownerName: form.values.ownerName.trim(),
        ownerInit: init,
        department: form.values.department,
        progress: 0,
        dueOrShipped: `Due ${new Date(form.values.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        status: "on-track",
        tone,
      })
      form.reset({ name: "", ownerName: "", department: "Engineering", dueDate: "" })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog
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
      />
      <Field
        label="Owner"
        value={form.values.ownerName}
        onChange={(v) => form.setValue("ownerName", v)}
        placeholder="Sofia Alvarez"
        required
      />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <SelectField
          label="Department"
          value={form.values.department}
          onChange={(v) => form.setValue("department", v)}
          options={PROJECT_DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          required
        />
        <Field
          label="Due date"
          type="date"
          value={form.values.dueDate}
          onChange={(v) => form.setValue("dueDate", v)}
          required
        />
      </div>
    </ActionDialog>
  )
}

function KanbanColumn({
  status,
  tasks,
}: {
  status: ProjectStatus
  tasks: ProjectTask[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const col = statusColumns.find((c) => c.id === status)!
  return (
    <div
      ref={setNodeRef}
      data-status={status}
      className={cn(
        "flex min-w-[240px] flex-1 flex-col gap-2.5 rounded-xl border p-3 transition-colors",
        isOver ? "border-[#2f6f61] bg-[#f0faf7]" : "border-[#e8ebe6] bg-[#f8f9fa]",
      )}
    >
      <div
        className={cn(
          "mx-0 mb-1 mt-0 flex items-center justify-between gap-2 rounded-[10px] border px-3 py-1.5",
          col.headerBg,
          col.headerBorder,
        )}
      >
        <span className={`size-2 shrink-0 rounded-full ${col.dot}`} />
        <span
          className={cn(
            "flex-1 font-sans text-[11px] font-bold uppercase leading-normal tracking-[0.55px]",
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
              "rounded-[14px] border border-dashed bg-white p-4 text-center font-sans text-[11.5px] text-[#8a948d]",
              isOver ? "border-[#2f6f61]" : "border-[#edeae3]",
            )}
          >
            Drop tasks here
          </div>
        ) : null}
        {tasks.map((task) => (
          <DraggableProjectCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

function DraggableProjectCard({ task }: { task: ProjectTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
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
      <ProjectCard task={task} />
    </div>
  )
}

function ProjectCard({ task }: { task: ProjectTask }) {
  const tone = cardToneStyles[task.tone]
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-[#edeae3] bg-white p-4">
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
        <span className="min-w-0 flex-1 font-sans text-[13px] font-semibold leading-tight text-[#1f2a26]">
          {task.name}
        </span>
      </div>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
        {task.department} · {task.ownerName}
      </span>
      <div className="flex flex-col gap-1.5">
        <div className="flex h-1.5 w-full overflow-clip rounded-full bg-[#f1eee8]">
          <div
            className="h-full rounded-full bg-[#2e9160]"
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
            {task.dueOrShipped}
          </span>
          <span className="font-sans inline-block text-[11px] font-semibold leading-normal text-[#42504a]">
            {task.progress}%
          </span>
        </div>
      </div>
    </div>
  )
}
