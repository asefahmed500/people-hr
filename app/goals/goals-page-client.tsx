"use client"

import * as React from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { GoalsHeader } from "@/components/goals/goals-header"
import { GoalsKpiStrip } from "@/components/goals/goals-kpi-strip"
import { ObjectivesGrid } from "@/components/goals/objectives-grid"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, TextArea, SelectField, useForm } from "@/components/shared/field"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/lib/toast"
import { useMockStore } from "@/hooks/use-mock-store"
import { type GoalsStore, STORAGE_KEYS, defaultGoalsStore, defaultNotificationsStore, newObjective, newNotification, type NotificationsStore, type Notification } from "@/lib/data"

export function GoalsPageClient() {
  const { state, setState, hydrated } = useMockStore<GoalsStore>(
    STORAGE_KEYS.goals,
    () => defaultGoalsStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }

  const [newGoalOpen, setNewGoalOpen] = React.useState(false)

  const goalForm = useForm({
    title: "",
    ownerName: "",
    ownerRole: "",
    deadline: "",
    description: "",
  })

  function handleNewGoal() {
    goalForm.reset()
    setNewGoalOpen(true)
  }

  function handleCreateGoal() {
    const obj = newObjective({
      title: goalForm.values.title,
      ownerName: goalForm.values.ownerName,
      ownerRole: goalForm.values.ownerRole,
    })
    setState((prev) => ({ objectives: [...prev.objectives, obj] }))
    notify.success("Goal created")
    addNotification({ type: "goal_updated", title: "New goal created", description: `${goalForm.values.title} added to objectives`, href: "/goals" })
    setNewGoalOpen(false)
  }

  function handleToggleKr(objId: string, krIdx: number) {
    setState((prev) => ({
      objectives: prev.objectives.map((o) => {
        if (o.id !== objId) return o
        const krs = o.krs.map((kr, idx) =>
          idx === krIdx ? { ...kr, pct: kr.pct >= 100 ? 0 : 100 } : kr,
        )
        const newProgress = Math.round(
          krs.reduce((s, kr) => s + kr.pct, 0) / krs.length,
        )
        return { ...o, krs, progress: newProgress }
      }),
    }))
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/goals" current="Goals" accentCurrent>
        <Skeleton className="h-12 w-full rounded-[14px]" />
        <Skeleton className="h-20 w-full rounded-[18px]" />
        <div className="grid grid-cols-2 gap-5">
          <Skeleton className="h-[300px] rounded-[18px]" />
          <Skeleton className="h-[300px] rounded-[18px]" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/goals" current="Goals" accentCurrent>
      <GoalsHeader
        onPeriodChange={() => notify.info("Period changed")}
        onNewGoal={handleNewGoal}
      />
      <GoalsKpiStrip objectives={state.objectives} />
      <ObjectivesGrid objectives={state.objectives} onToggleKr={handleToggleKr} />
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
    </DashboardShell>
  )
}
