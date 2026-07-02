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
import { ChevronRight, Ellipsis, Plus } from "lucide-react"

import {
  STORAGE_KEYS,
  defaultRecruitmentStore,
  defaultNotificationsStore,
  newNotification,
  stageMeta,
  stageOrder,
  type Candidate,
  type CandidateStage,
  type RecruitmentStore,
  type NotificationsStore,
  type Notification,
} from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"
import { onAction } from "@/lib/command-actions"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField, useForm } from "@/components/shared/field"
import { RecruitmentHeader } from "@/components/recruitment/recruitment-header"
import { RecruitmentKpiStrip } from "@/components/recruitment/recruitment-kpi-strip"
import { PipelineFunnelCard } from "@/components/recruitment/pipeline-funnel-card"
import { OpenRolesByDept } from "@/components/recruitment/open-roles-by-dept"
import { ConversionRateCard } from "@/components/recruitment/conversion-rate-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function RecruitmentPageClient() {
  const { state: store, setState: setStore } = useMockStore<RecruitmentStore>(
    STORAGE_KEYS.recruitment,
    () => defaultRecruitmentStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }
  const [postOpen, setPostOpen] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(
    () =>
      onAction((id) => {
        if (id === "post-job") setPostOpen(true)
      }),
    [],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const overStage = String(over.id) as CandidateStage
    if (!stageOrder.includes(overStage)) return
    setStore((prev) => ({
      ...prev,
      candidates: prev.candidates.map((c) =>
        c.id === String(active.id) ? { ...c, stage: overStage } : c,
      ),
    }))
    const c = store.candidates.find((x) => x.id === String(active.id))
    if (c) {
      notify.success(`${c.name} → ${stageMeta[overStage].label}`)
      addNotification({ type: "candidate_moved", title: "Candidate moved", description: `${c.name} moved to ${stageMeta[overStage].label}`, href: "/recruitment" })
    }
  }

  const moveTo = (candidateId: string, stage: CandidateStage) => {
    setStore((prev) => ({
      ...prev,
      candidates: prev.candidates.map((c) =>
        c.id === candidateId ? { ...c, stage } : c,
      ),
    }))
    const c = store.candidates.find((x) => x.id === candidateId)
    if (c) notify.success(`${c.name} → ${stageMeta[stage].label}`)
  }

  const activeCandidate = store.candidates.find((c) => c.id === activeId) ?? null

  return (
    <>
      <RecruitmentHeader
        onPostClick={() => setPostOpen(true)}
        onFilterRoles={() => notify.info("Filter by role")}
      />
      <RecruitmentKpiStrip
        openRoles={store.openings.length}
        candidates={store.candidates.length}
        interviews={store.candidates.filter((c) => c.stage === "interview").length}
        aged={store.candidates.filter((c) => {
          const v = c.appliedAt
          return v.includes("w") || (v.includes("d") && parseInt(v) > 7)
        }).length}
      />
      <PipelineFunnelCard candidates={store.candidates} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <OpenRolesByDept openings={store.openings} />
        <div className="flex w-full flex-col gap-5 lg:w-[300px] lg:shrink-0">
          <ConversionRateCard
            rate={
              store.candidates.length === 0
                ? 0
                : Math.round(
                    (store.candidates.filter((c) => c.stage === "hired").length /
                      store.candidates.length) *
                      1000,
                  ) / 10
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
          Candidate board
        </h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3.5 overflow-x-auto pb-2">
            {stageOrder.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                candidates={store.candidates.filter((c) => c.stage === stage)}
                onMove={moveTo}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCandidate ? (
              <div className="w-[230px] rotate-2 opacity-95">
                <CandidateCard candidate={activeCandidate} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <PostJobDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        onAdd={(title, department, location) => {
          setStore((prev) => ({
            ...prev,
            openings: [
              {
                id: `o-${Math.random().toString(36).slice(2, 9)}`,
                title,
                department,
                location,
                applicants: 0,
                postedDaysAgo: 0,
              },
              ...prev.openings,
            ],
          }))
          notify.success(`Job posted: ${title}`)
          addNotification({ type: "project_created", title: "Job posted", description: `${title} posted in ${department}`, href: "/recruitment" })
        }}
      />
    </>
  )
}

function KanbanColumn({
  stage,
  candidates,
  onMove,
}: {
  stage: CandidateStage
  candidates: Candidate[]
  onMove: (id: string, stage: CandidateStage) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const meta = stageMeta[stage]
  return (
    <div
      ref={setNodeRef}
      data-stage={stage}
      className={cn(
        "flex min-w-[230px] flex-1 flex-col gap-2.5 rounded-[14px] border p-3.5 transition-colors",
        isOver ? "border-[#2f6f61] bg-[#f0faf7]" : "border-[#efede6] bg-[#f8f7f4]",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <span className={`size-2 rounded-full ${meta.dot}`} />
          <span className="font-sans text-[12.5px] font-semibold leading-normal text-[#1f2a26]">
            {meta.label}
          </span>
        </div>
        <span className="font-sans text-xs font-semibold leading-normal text-[#8a948d]">
          {candidates.length}
        </span>
      </div>
      <div className="flex h-[5px] w-full overflow-clip rounded-full bg-[#eae7e0]">
        <div
          className={cn("h-full rounded-full", meta.fill)}
          style={{
            width: `${Math.min(100, (candidates.length / 10) * 100)}%`,
          }}
        />
      </div>
      <div className="flex flex-col gap-2.5">
        {candidates.length === 0 ? (
          <div
            className={cn(
              "rounded-[10px] border border-dashed bg-white p-3 text-center font-sans text-[11px] text-[#8a948d]",
              isOver ? "border-[#2f6f61]" : "border-[#edeae3]",
            )}
          >
            Drop candidates here
          </div>
        ) : null}
        {candidates.map((c) => (
          <DraggableCandidate key={c.id} candidate={c} onMove={onMove} />
        ))}
      </div>
    </div>
  )
}

function DraggableCandidate({
  candidate,
  onMove,
}: {
  candidate: Candidate
  onMove: (id: string, stage: CandidateStage) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: candidate.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className={cn(isDragging && "opacity-50")}>
      <CandidateCard candidate={candidate} onMove={onMove} />
    </div>
  )
}

function CandidateCard({
  candidate,
  onMove,
}: {
  candidate: Candidate
  onMove?: (id: string, stage: CandidateStage) => void
}) {
  const meta = stageMeta[candidate.stage]
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-[#efede6] bg-white p-2">
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          meta.avatarBg,
        )}
      >
        <span
          className={cn(
            "font-sans text-[10px] font-bold leading-normal",
            meta.avatarText,
          )}
        >
          {candidate.initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="inline-block overflow-clip font-sans text-[11px] font-semibold leading-[1.2] text-[#1f2a26] [text-overflow:ellipsis]">
          {candidate.name}
        </span>
        <span className="inline-block overflow-clip font-sans text-[9.5px] leading-[1.2] text-[#a6aca3] [text-overflow:ellipsis]">
          {candidate.role}
        </span>
      </div>
      {onMove ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Move ${candidate.name}`}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#b0b7af] hover:bg-[#faf9f6]"
            >
              <Ellipsis className="size-3.5" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {stageOrder
              .filter((s) => s !== candidate.stage)
              .map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onMove(candidate.id, s)}
                >
                  Move to {stageMeta[s].label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

const DEPARTMENTS = ["Engineering", "Design", "Product", "Sales", "Marketing", "People", "Research", "Finance"]

function PostJobDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (title: string, department: string, location: string) => void
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({
    title: "",
    department: "Engineering",
    location: "Remote",
  })
  const onSubmit = () => {
    if (!form.values.title.trim()) {
      form.setErrors({ title: "Title is required" })
      return
    }
    setSubmitting(true)
    try {
      onAdd(form.values.title, form.values.department, form.values.location)
      form.reset({ title: "", department: "Engineering", location: "Remote" })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Post a job"
      description="Add a new open role to the recruitment board."
      submitLabel="Post job"
      submitting={submitting}
      onSubmit={onSubmit}
    >
      <Field
        label="Job title"
        value={form.values.title}
        onChange={(v) => form.setValue("title", v)}
        placeholder="Senior Frontend Engineer"
        required
        error={form.errors.title}
      />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <SelectField
          label="Department"
          value={form.values.department}
          onChange={(v) => form.setValue("department", v)}
          options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
        />
        <Field
          label="Location"
          value={form.values.location}
          onChange={(v) => form.setValue("location", v)}
        />
      </div>
    </ActionDialog>
  )
}
