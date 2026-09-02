"use client"

import * as React from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { GoalsHeader } from "@/components/goals/goals-header"
import { GoalsKpiStrip } from "@/components/goals/goals-kpi-strip"
import { ObjectivesGrid } from "@/components/goals/objectives-grid"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, TextArea, useForm } from "@/components/shared/field"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { onAction, consumePendingAction } from "@/lib/command-actions"
import {
  type GoalsStore,
  type Objective,
  type KeyResult,
  defaultGoalsStore,
  newObjective,
  deriveStatus,
} from "@/lib/data"

const KR_STEPS = [0, 25, 50, 75, 100]

export function GoalsPageClient() {
  const { state, setState, hydrated } = useApiStore<GoalsStore>(
    "/api/store/goals",
    () => defaultGoalsStore,
  )
  const { user } = useAuth()
  const canEdit = !!user
  // Goals are scoped to the owner on the server — non-admins can't reassign
  // an objective to someone else, so the owner field stays locked to them.
  const canReassign = user?.role === "admin"

  const [newGoalOpen, setNewGoalOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<Objective | null>(null)
  const [krTarget, setKrTarget] = React.useState<Objective | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Objective | null>(null)

  React.useEffect(() => {
    const off = onAction((id) => {
      if (id === "new-goal" && canEdit) handleNewGoal()
    })
    if (canEdit && consumePendingAction("new-goal")) handleNewGoal()
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit])

  const goalForm = useForm({
    title: "",
    ownerName: "",
    ownerRole: "",
    deadline: "",
    description: "",
  })
  const krForm = useForm({ label: "", pct: "50" })

  function handleNewGoal() {
    goalForm.reset(
      user?.role !== "admin" && user?.name
        ? { title: "", ownerName: user.name, ownerRole: "", deadline: "", description: "" }
        : undefined,
    )
    setNewGoalOpen(true)
  }

  React.useEffect(() => {
    if (editTarget) {
      goalForm.setValue("title", editTarget.title)
      goalForm.setValue("ownerName", editTarget.ownerName)
      goalForm.setValue("ownerRole", editTarget.ownerRole)
      goalForm.setValue("deadline", editTarget.deadline ?? "")
      goalForm.setValue("description", editTarget.description ?? "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTarget])

  function handleCreateGoal() {
    const v = goalForm.values
    if (!v.title.trim() || !v.ownerName.trim() || !v.ownerRole.trim()) {
      notify.error("Missing details", "Title, owner name and role are required.")
      return
    }
    const obj = newObjective({
      title: v.title.trim(),
      ownerName: v.ownerName.trim(),
      ownerRole: v.ownerRole.trim(),
      deadline: v.deadline,
      description: v.description,
    })
    setState((prev) => ({ objectives: [...prev.objectives, obj] }))
    notify.success("Goal created", `“${obj.title}” added to objectives.`)
    setNewGoalOpen(false)
  }

  // Clicking a KR cycles its progress: 0 → 25 → 50 → 75 → 100 → 0.
  function handleCycleKr(objId: string, krIdx: number) {
    setState((prev) => ({
      objectives: prev.objectives.map((o) => {
        if (o.id !== objId) return o
        const krs = o.krs.map((kr, idx) => {
          if (idx !== krIdx) return kr
          const cur = KR_STEPS.indexOf(kr.pct)
          const next =
            cur === KR_STEPS.length - 1
              ? 0
              : cur < 0
                ? KR_STEPS[1] // non-step value snaps up to the first step
                : KR_STEPS[cur + 1]
          return { ...kr, pct: next }
        })
        return recompute(o, krs)
      }),
    }))
  }

  function handleRemoveKr(objId: string, krId: string) {
    setState((prev) => ({
      objectives: prev.objectives.map((o) => {
        if (o.id !== objId) return o
        const krs = o.krs.filter((kr) => kr.id !== krId)
        return recompute(o, krs)
      }),
    }))
  }

  function handleAddKr() {
    if (!krTarget) return
    const label = krForm.values.label.trim()
    if (!label) {
      notify.error("Missing key result", "Add a short label for the key result.")
      return
    }
    const pct = Math.max(0, Math.min(100, parseInt(krForm.values.pct, 10) || 0))
    const kr: KeyResult = { id: `k-${Math.random().toString(36).slice(2, 9)}`, label, pct }
    setState((prev) => ({
      objectives: prev.objectives.map((o) => {
        if (o.id !== krTarget.id) return o
        const krs = [...o.krs, kr]
        return recompute(o, krs)
      }),
    }))
    notify.success("Key result added", `“${label}” added to ${krTarget.title}.`)
    krForm.reset({ label: "", pct: "50" })
    setKrTarget(null)
  }

  function handleDeleteObjective() {
    if (!deleteTarget) return
    setState((prev) => ({
      objectives: prev.objectives.filter((o) => o.id !== deleteTarget.id),
    }))
    notify.success("Objective deleted", `“${deleteTarget.title}” was removed.`)
    setDeleteTarget(null)
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/goals" current="Goals" accentCurrent>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-5">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/goals" current="Goals" accentCurrent>
      <GoalsHeader onNewGoal={canEdit ? handleNewGoal : undefined} />
      <GoalsKpiStrip objectives={state.objectives} />
      <ObjectivesGrid
        objectives={state.objectives}
        onCycleKr={canEdit ? handleCycleKr : undefined}
        onRemoveKr={canEdit ? handleRemoveKr : undefined}
        onEdit={canEdit ? setEditTarget : undefined}
        onAddKr={
          canEdit
            ? (o) => {
                krForm.reset({ label: "", pct: "50" })
                setKrTarget(o)
              }
            : undefined
        }
        onDelete={canEdit ? setDeleteTarget : undefined}
      />
      <ActionDialog
        open={newGoalOpen}
        onOpenChange={setNewGoalOpen}
        title="New goal"
        description="Create a new company objective"
        submitLabel="Create goal"
        onSubmit={handleCreateGoal}
      >
        <Field
          label="Title"
          value={goalForm.values.title}
          onChange={(v) => goalForm.setValue("title", v)}
          placeholder="e.g. Grow ARR to $24M"
          required
        />
        <Field
          label="Owner name"
          value={goalForm.values.ownerName}
          onChange={(v) => goalForm.setValue("ownerName", v)}
          placeholder="e.g. Marcus Bailey"
          disabled={!canReassign}
          required
        />
        <Field
          label="Owner role"
          value={goalForm.values.ownerRole}
          onChange={(v) => goalForm.setValue("ownerRole", v)}
          placeholder="e.g. Chief Revenue Officer"
          required
        />
        <Field
          label="Deadline"
          type="date"
          value={goalForm.values.deadline}
          onChange={(v) => goalForm.setValue("deadline", v)}
        />
        <TextArea
          label="Description"
          value={goalForm.values.description}
          onChange={(v) => goalForm.setValue("description", v)}
          placeholder="Brief description of this objective..."
        />
      </ActionDialog>
      <ActionDialog
        open={!!editTarget}
        onOpenChange={(o) => { if (!o) setEditTarget(null) }}
        title="Edit objective"
        description={editTarget ? `Update “${editTarget.title}”.` : ""}
        submitLabel="Save changes"
        onSubmit={() => {
          if (!editTarget) return
          const v = goalForm.values
          if (!v.title.trim() || !v.ownerName.trim() || !v.ownerRole.trim()) {
            notify.error("Missing details", "Title, owner name and role are required.")
            return
          }
          setState((prev) => ({
            objectives: prev.objectives.map((o) =>
              o.id === editTarget.id
                ? {
                    ...o,
                    title: v.title.trim(),
                    ownerName: v.ownerName.trim(),
                    ownerRole: v.ownerRole.trim(),
                    deadline: v.deadline,
                    description: v.description,
                  }
                : o,
            ),
          }))
          notify.success("Objective updated", `“${v.title.trim()}” saved.`)
          setEditTarget(null)
        }}
      >
        <Field
          label="Title"
          value={goalForm.values.title}
          onChange={(v) => goalForm.setValue("title", v)}
          placeholder="e.g. Grow ARR to $24M"
          required
        />
        <Field
          label="Owner name"
          value={goalForm.values.ownerName}
          onChange={(v) => goalForm.setValue("ownerName", v)}
          placeholder="e.g. Marcus Bailey"
          disabled={!canReassign}
          required
        />
        <Field
          label="Owner role"
          value={goalForm.values.ownerRole}
          onChange={(v) => goalForm.setValue("ownerRole", v)}
          placeholder="e.g. Chief Revenue Officer"
          required
        />
        <Field
          label="Deadline"
          type="date"
          value={goalForm.values.deadline}
          onChange={(v) => goalForm.setValue("deadline", v)}
        />
        <TextArea
          label="Description"
          value={goalForm.values.description}
          onChange={(v) => goalForm.setValue("description", v)}
          placeholder="Brief description of this objective..."
        />
      </ActionDialog>
      <ActionDialog
        open={!!krTarget}
        onOpenChange={(o) => !o && setKrTarget(null)}
        title="Add key result"
        description={krTarget ? `Add a key result to “${krTarget.title}”` : ""}
        submitLabel="Add key result"
        onSubmit={handleAddKr}
      >
        <Field
          label="Label"
          value={krForm.values.label}
          onChange={(v) => krForm.setValue("label", v)}
          placeholder="e.g. Close $6.2M new logo"
          required
        />
        <Field
          label="Current progress (%)"
          type="number"
          value={krForm.values.pct}
          onChange={(v) => krForm.setValue("pct", v)}
        />
      </ActionDialog>
      <ActionDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete objective"
        description={`Delete “${deleteTarget?.title}” and all of its key results?`}
        submitLabel="Delete"
        submitVariant="destructive"
        onSubmit={handleDeleteObjective}
      >
        <p className="font-sans text-[12.5px] leading-normal text-secondary-foreground">
          This removes the objective and its {deleteTarget?.krs.length ?? 0} key result
          {deleteTarget?.krs.length === 1 ? "" : "s"}. This can’t be undone.
        </p>
      </ActionDialog>
    </DashboardShell>
  )
}

function recompute(o: Objective, krs: KeyResult[]): Objective {
  const newProgress = krs.length
    ? Math.round(krs.reduce((s, kr) => s + kr.pct, 0) / krs.length)
    : 0
  return { ...o, krs, progress: newProgress, status: deriveStatus(newProgress) }
}
