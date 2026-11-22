"use client"

import * as React from "react"
import { z } from "zod"

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
import { Ellipsis, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

import {
  defaultRecruitmentStore,
  defaultEmployees,
  defaultLeaveStore,
  defaultOnboardingStore,
  DEPARTMENTS,
  stageMeta,
  stageOrder,
  type Candidate,
  type CandidateStage,
  type Opening,
  type RecruitmentStore,
  type LeaveStore,
  type OnboardingStore,
} from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { apiRequest } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { onAction, consumePendingAction } from "@/lib/command-actions"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { cn } from "@/lib/utils"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Field, SelectField, useForm } from "@/components/shared/field"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { RecruitmentHeader } from "@/components/recruitment/recruitment-header"
import { RecruitmentKpiStrip } from "@/components/recruitment/recruitment-kpi-strip"
import { PipelineFunnelCard } from "@/components/recruitment/pipeline-funnel-card"
import { OpenRolesByDept } from "@/components/recruitment/open-roles-by-dept"
import { ConversionRateCard } from "@/components/recruitment/conversion-rate-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function RecruitmentPageClient() {
  const { user } = useAuth()
  const canWrite = user?.role === "admin"
  const {
    state: store,
    setState: setStore,
    hydrated: recruitmentHydrated,
    error: recruitmentError,
    retry: retryRecruitment,
  } = useApiStore<RecruitmentStore>(
    "/api/store/recruitment",
    () => defaultRecruitmentStore,
  )
  const {
    hydrated: employeesHydrated,
    error: employeesError,
    retry: retryEmployees,
  } = useApiStore<unknown[]>("/api/store/employees", () => defaultEmployees)
  const {
    hydrated: leaveHydrated,
    error: leaveError,
    retry: retryLeave,
  } = useApiStore<LeaveStore>("/api/store/leave", () => defaultLeaveStore)
  const {
    hydrated: onboardingHydrated,
    error: onboardingError,
    retry: retryOnboarding,
  } = useApiStore<OnboardingStore>("/api/store/onboarding", () => defaultOnboardingStore)
  const hydrated = recruitmentHydrated && employeesHydrated && leaveHydrated && onboardingHydrated
  const error = recruitmentError || employeesError || leaveError || onboardingError
  const retry = () => {
    retryRecruitment()
    retryEmployees()
    retryLeave()
    retryOnboarding()
  }
  const [postOpen, setPostOpen] = React.useState(false)
  const [candidateOpen, setCandidateOpen] = React.useState(false)
  const [editingCandidate, setEditingCandidate] = React.useState<Candidate | null>(null)
  const [closingOpening, setClosingOpening] = React.useState<Opening | null>(null)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [hiringId, setHiringId] = React.useState<string | null>(null)
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [removeTarget, setRemoveTarget] = React.useState<Candidate | null>(null)

  React.useEffect(() => {
    const off = onAction((id) => {
      if (id === "post-job" && canWrite) setPostOpen(true)
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (canWrite && consumePendingAction("post-job")) setPostOpen(true)
    return off
  }, [canWrite])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = (e: DragStartEvent) => {
    if (!canWrite) return
    setActiveId(String(e.active.id))
  }

  const onDragEnd = (e: DragEndEvent) => {
    if (!canWrite) return
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const overStage = String(over.id) as CandidateStage
    if (!stageOrder.includes(overStage)) return
    // Route through moveTo so dropping a candidate on "hired" runs the same
    // side-effects as the dropdown (employee + leave balance + notification).
    moveTo(String(active.id), overStage)
  }

  const moveTo = async (candidateId: string, stage: CandidateStage) => {
    const c = store.candidates.find((x) => x.id === candidateId)
    if (!c || !canWrite || c.stage === stage) return

    // Hiring is a business transition, not four independent CRUD writes. One
    // server call creates the employee, leave entitlement and onboarding
    // checklist atomically; the affected stores are refetched afterwards.
    if (stage === "hired") {
      setHiringId(candidateId)
      try {
        const result = await apiRequest<{
          employeeId: string
          onboardingTasks: number
          alreadyHired?: boolean
        }>("/api/lifecycle/hire", { method: "POST", body: { candidateId } })
        notify.success(
          result.alreadyHired ? "Already hired" : "Hire completed",
          `${c.name} is now an employee with ${result.onboardingTasks} onboarding task(s).`,
        )
        retry()
      } catch (error) {
        notify.error(
          "Could not complete hire",
          error instanceof Error ? error.message : "Please try again.",
        )
      } finally {
        setHiringId(null)
      }
      return
    }

    setStore((prev) => ({
      ...prev,
      candidates: prev.candidates.map((x) => (x.id === candidateId ? { ...x, stage } : x)),
    }))
    notify.success(`${c.name} → ${stageMeta[stage].label}`)
  }

  const removeCandidate = (candidateId: string) => {
    const c = store.candidates.find((x) => x.id === candidateId)
    setStore((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((x) => x.id !== candidateId),
    }))
    if (c) notify.success("Candidate removed", `${c.name} removed from the pipeline.`)
  }

  const activeCandidate = store.candidates.find((c) => c.id === activeId) ?? null
  const roleOptions = React.useMemo(() => {
    const roles = Array.from(new Set(store.candidates.map((c) => c.role)))
    return [
      { value: "all", label: "All roles" },
      ...roles.map((r) => ({ value: r, label: r })),
    ]
  }, [store.candidates])

  const visibleCandidates = React.useMemo(
    () =>
      roleFilter === "all"
        ? store.candidates
        : store.candidates.filter((c) => c.role === roleFilter),
    [store.candidates, roleFilter],
  )

  const handleExport = () => {
    exportToCsv("recruitment-pipeline", visibleCandidates, [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "department", label: "Department" },
      { key: "stage", label: "Stage" },
      { key: "appliedAt", label: "Applied" },
    ])
    notify.success("Pipeline exported", `${visibleCandidates.length} candidates downloaded as CSV.`)
  }

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
      <RecruitmentHeader
        onPostClick={canWrite ? () => setPostOpen(true) : undefined}
        onAddCandidate={
          canWrite
            ? () => {
                setEditingCandidate(null)
                setCandidateOpen(true)
              }
            : undefined
        }
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        roleOptions={roleOptions}
        onExport={handleExport}
      />
      <RecruitmentKpiStrip
        openRoles={store.openings.length}
        candidates={store.candidates.length}
        interviews={store.candidates.filter((c) => c.stage === "interview").length}
        aged={store.openings.filter((o) => o.postedDaysAgo > 45).length}
      />
      <PipelineFunnelCard candidates={store.candidates} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <OpenRolesByDept
            openings={store.openings}
            onCloseOpening={
              canWrite
                ? (id) => {
                    const o = store.openings.find((x) => x.id === id)
                    setClosingOpening(o ?? null)
                  }
                : undefined
            }
          />
        <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
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
        <h2 className="text-h3">
          Candidate board
        </h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
                        {stageOrder.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                candidates={visibleCandidates.filter((c) => c.stage === stage)}
                pendingId={hiringId}
                onMove={canWrite ? moveTo : undefined}
                onEdit={
                  canWrite
                    ? (id) => {
                        const c = store.candidates.find((x) => x.id === id)
                        if (c) {
                          setEditingCandidate(c)
                          setCandidateOpen(true)
                        }
                      }
                    : undefined
                }
                onDelete={
                  canWrite
                    ? (id) => {
                        const c = store.candidates.find((x) => x.id === id)
                        setRemoveTarget(c ?? null)
                      }
                    : undefined
                }
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

        }}
      />
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Remove candidate"
        description={
          removeTarget
            ? `Remove ${removeTarget.name} from the ${removeTarget.role} pipeline? This canÃ¢â‚¬â„¢t be undone.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (removeTarget) removeCandidate(removeTarget.id)
          setRemoveTarget(null)
        }}
      />
      <CandidateDialog
        open={candidateOpen}
        onOpenChange={(o) => {
          setCandidateOpen(o)
          if (!o) setEditingCandidate(null)
        }}
        candidate={editingCandidate ?? undefined}
        onSave={(candidate) => {
          if (editingCandidate) {
            setStore((prev) => ({
              ...prev,
              candidates: prev.candidates.map((c) =>
                c.id === editingCandidate.id ? candidate : c,
              ),
            }))
            notify.success("Candidate updated", `${candidate.name} details saved.`)
          } else {
            setStore((prev) => ({
              ...prev,
              candidates: [{ ...candidate, stage: "applied" as const }, ...prev.candidates],
            }))
            notify.success("Candidate added", `${candidate.name} added to the pipeline.`)

          }
        }}
      />
      <ConfirmDialog
        open={!!closingOpening}
        onOpenChange={(o) => !o && setClosingOpening(null)}
        title="Close opening"
        description={
          closingOpening
            ? `Close the Ã¢â‚¬Å“${closingOpening.title}Ã¢â‚¬Â opening? It will be removed from the board.`
            : undefined
        }
        confirmLabel="Close opening"
        destructive
        onConfirm={() => {
          if (closingOpening) {
            setStore((prev) => ({
              ...prev,
              openings: prev.openings.filter((o) => o.id !== closingOpening.id),
            }))
            notify.success("Opening closed", `Ã¢â‚¬Å“${closingOpening.title}Ã¢â‚¬Â was removed.`)
          }
          setClosingOpening(null)
        }}
      />
    </>
  )
}

function KanbanColumn({
  stage,
  candidates,
  pendingId,
  onMove,
  onEdit,
  onDelete,
}: {
  stage: CandidateStage
  candidates: Candidate[]
  pendingId?: string | null
  onMove?: (id: string, stage: CandidateStage) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const meta = stageMeta[stage]
  return (
    <div
      ref={setNodeRef}
      data-stage={stage}
      className={cn(
        "flex min-w-[230px] flex-1 flex-col gap-2.5 rounded-lg border bg-card p-3 transition-colors",
        isOver ? "border-primary" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <span className={`size-2 rounded-full ${meta.dot}`} />
          <span className="font-sans text-[12.5px] font-semibold leading-normal text-foreground">
            {meta.label}
          </span>
        </div>
        <span className="font-sans text-xs font-semibold leading-normal text-muted-foreground">
          {candidates.length}
        </span>
      </div>
      <div className="flex h-[5px] w-full overflow-clip rounded-full bg-muted">
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
              "rounded-lg border border-dashed bg-muted p-3 text-center font-sans text-[11px] text-muted-foreground",
              isOver ? "border-primary" : "border-border",
            )}
          >
            Drop candidates here
          </div>
        ) : null}
        {candidates.map((c) => (
          <DraggableCandidate key={c.id} candidate={c} pendingId={pendingId} onMove={onMove} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function DraggableCandidate({
  candidate,
  pendingId,
  onMove,
  onEdit,
  onDelete,
}: {
  candidate: Candidate
  pendingId?: string | null
  onMove?: (id: string, stage: CandidateStage) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    disabled: !onMove || pendingId === candidate.id,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className={cn(isDragging && "opacity-50")}>
      <CandidateCard candidate={candidate} pendingId={pendingId} onMove={onMove} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

function CandidateCard({
  candidate,
  pendingId,
  onMove,
  onEdit,
  onDelete,
}: {
  candidate: Candidate
  pendingId?: string | null
  onMove?: (id: string, stage: CandidateStage) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const meta = stageMeta[candidate.stage]
  const pending = pendingId === candidate.id
  return (
    <div
      aria-busy={pending || undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition-[opacity,box-shadow] duration-150",
        pending && "pointer-events-none opacity-60 shadow-[0_0_0_1px_var(--primary)]",
      )}
    >
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          meta.avatarBg,
        )}
      >
        <span
          className={cn(
            "font-sans text-[10px] font-semibold leading-normal",
            meta.avatarText,
          )}
        >
          {candidate.initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="inline-block overflow-clip font-sans text-[11px] font-semibold leading-[1.2] text-foreground [text-overflow:ellipsis]">
          {candidate.name}
        </span>
        <span className="inline-block overflow-clip font-sans text-[9.5px] leading-[1.2] text-muted-foreground [text-overflow:ellipsis]">
          {candidate.role}
        </span>
      </div>
      {onMove || onEdit || onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-6 rounded-md"
              aria-label={`Move ${candidate.name}`}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Ellipsis className="size-3.5" strokeWidth={2} />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {stageOrder
              .filter((s) => s !== candidate.stage)
              .map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onMove?.(candidate.id, s)}
                >
                  Move to {stageMeta[s].label}
                </DropdownMenuItem>
              ))}
            {onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(candidate.id)}>
                Edit details
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(candidate.id)}
                >
                  Remove candidate
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

const candidateFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  email: z.string().refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
  phone: z.string().refine((v) => v === "" || /^[+]?[\d\s()-]{7,18}$/.test(v), "Enter a valid phone number"),
  offeredSalary: z
    .string()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 0), "Enter a whole amount"),
})

function CandidateDialog({
  open,
  onOpenChange,
  candidate,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate?: Candidate
  onSave: (candidate: Candidate) => void
}) {
  const isEdit = !!candidate
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({
    name: candidate?.name ?? "",
    role: candidate?.role ?? "",
    department: candidate?.department ?? "Engineering",
    stage: candidate ? (candidate.stage as string) : "applied",
    source: candidate?.source ?? "careers-page",
    email: candidate?.email ?? "",
    phone: candidate?.phone ?? "",
    offeredSalary: candidate?.offeredSalary != null ? String(candidate.offeredSalary) : "",
  })

  // Always-mounted dialog: re-sync the form every time it opens so edits
  // pre-fill the selected candidate and cancelled drafts don't leak back in.
  React.useEffect(() => {
    if (!open) return
    form.reset({
      name: candidate?.name ?? "",
      role: candidate?.role ?? "",
      department: candidate?.department ?? "Engineering",
      stage: candidate ? (candidate.stage as string) : "applied",
      source: candidate?.source ?? "careers-page",
      email: candidate?.email ?? "",
      phone: candidate?.phone ?? "",
      offeredSalary: candidate?.offeredSalary != null ? String(candidate.offeredSalary) : "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const onSubmit = () => {
    const parsed = candidateFormSchema.safeParse(form.values)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        if (!errs[key]) errs[key] = issue.message
      }
      form.setErrors(errs as never)
      return
    }
    setSubmitting(true)
    try {
      onSave({
        id: candidate?.id ?? `c-${Math.random().toString(36).slice(2, 9)}`,
        name: parsed.data.name.trim(),
        initials: candidate?.initials ?? parsed.data.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
        role: parsed.data.role.trim(),
        department: form.values.department,
        appliedAt: candidate?.appliedAt ?? new Date().toISOString().slice(0, 10),
        stage: (isEdit ? form.values.stage : "applied") as Candidate["stage"],
        source: form.values.source,
        email: parsed.data.email || undefined,
        phone: parsed.data.phone || undefined,
        offeredSalary: parsed.data.offeredSalary === "" ? undefined : Number(parsed.data.offeredSalary),
        salaryCurrency: parsed.data.offeredSalary === "" ? undefined : "USD",
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
      title={isEdit ? "Edit candidate" : "Add candidate"}
      description={isEdit ? `Update ${candidate?.name}'s details.` : "Add a candidate to the pipeline."}
      submitLabel={isEdit ? "Save changes" : "Add candidate"}
      submitting={submitting}
      onSubmit={onSubmit}
    >
      <Field
        label="Full name"
        value={form.values.name}
        onChange={(v) => form.setValue("name", v)}
        placeholder="e.g. Riley Chen"
        required
        error={form.errors.name}
      />
      <Field
        label="Role applied for"
        value={form.values.role}
        onChange={(v) => form.setValue("role", v)}
        placeholder="e.g. Data Analyst"
        required
        error={form.errors.role}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Department"
          value={form.values.department}
          onChange={(v) => form.setValue("department", v)}
          options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          required
        />
        {/* Stage is intentionally not editable here: moving to "Hired" must go
            through moveTo() so the employee + leave balance side effects run. */}
        <SelectField
          label="Source"
          value={form.values.source}
          onChange={(v) => form.setValue("source", v)}
          options={[
            { value: "careers-page", label: "Careers page" },
            { value: "referral", label: "Referral" },
            { value: "linkedin", label: "LinkedIn" },
            { value: "agency", label: "Agency" },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Email"
          type="email"
          value={form.values.email ?? ""}
          onChange={(v) => form.setValue("email", v)}
          placeholder="riley@example.com"
          error={form.errors.email}
        />
        <Field
          label="Phone"
          value={form.values.phone ?? ""}
          onChange={(v) => form.setValue("phone", v)}
          placeholder="+1 555 010 2030"
          error={form.errors.phone}
        />
        <Field
          label="Agreed salary (USD, optional)"
          type="number"
          value={form.values.offeredSalary ?? ""}
          onChange={(v) => form.setValue("offeredSalary", v)}
          placeholder="Carried into payroll when hired"
          error={form.errors.offeredSalary}
        />
      </div>
    </ActionDialog>
  )
}

const postJobSchema = z.object({
  title: z.string().min(2, "Job title is required"),
  location: z.string().min(2, "Location is required"),
})

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

  React.useEffect(() => {
    if (!open) return
    form.reset({ title: "", department: "Engineering", location: "Remote" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const onSubmit = () => {
    const parsed = postJobSchema.safeParse(form.values)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        if (!errs[key]) errs[key] = issue.message
      }
      form.setErrors(errs as never)
      return
    }
    setSubmitting(true)
    try {
      onAdd(parsed.data.title, form.values.department, parsed.data.location)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <ActionDialog width="wide"
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
