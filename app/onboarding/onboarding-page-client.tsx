"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { OnboardingKpiStrip } from "@/components/onboarding/onboarding-kpi-strip"
import { OnboardingJourney } from "@/components/onboarding/onboarding-journey"
import { ProgressByPhase } from "@/components/onboarding/progress-by-phase"
import { OnboardingByDept } from "@/components/onboarding/onboarding-by-dept"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Field, SelectField } from "@/components/shared/field"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { defaultOnboardingStore, DEPARTMENTS, phaseOrder } from "@/lib/data"
import type { OnboardingStore, OnboardingTask } from "@/lib/data"
import { notify } from "@/lib/toast"
import { exportToCsv } from "@/lib/export"
import { scopeDepartments } from "@/lib/role-scope"

export function OnboardingPageClient() {
  const { state, setState, hydrated } = useApiStore<OnboardingStore>(
    "/api/store/onboarding",
    () => defaultOnboardingStore,
  )
  const { user } = useAuth()
  const canWrite = user?.role === "admin" || user?.role === "manager"
  // Managers may only onboard hires into their own department (the server
  // merge rejects rows outside it), so lock the dropdown to it.
  const hireDeptOptions = scopeDepartments(user, DEPARTMENTS)
  const [addOpen, setAddOpen] = useState(false)
  const [hireName, setHireName] = useState("")
  const [hireRole, setHireRole] = useState("")
  const [hireDept, setHireDept] = useState("")
  const [deleteTask, setDeleteTask] = useState<OnboardingTask | null>(null)

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/onboarding" current="Onboarding" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <div className="mt-4 flex gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] flex-1 rounded-2xl" />
          ))}
        </div>
        <div className="mt-5 flex gap-5">
          <Skeleton className="h-[400px] flex-1 rounded-2xl" />
          <div className="flex w-[340px] shrink-0 flex-col gap-5">
            <Skeleton className="h-[300px] rounded-2xl" />
            <Skeleton className="h-[250px] rounded-2xl" />
          </div>
        </div>
      </DashboardShell>
    )
  }

    const handleToggleTask = (id: string) => {
    const t = state.tasks.find((x) => x.id === id)
    if (!t) return
    const toggledDone = !t.done
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
    }))
    notify.success(toggledDone ? "Task completed" : "Task reopened", t.label)

  }

  const handleAdvanceHire = (hireName: string) => {
    const hireTasks = state.tasks.filter((t) => t.hireName === hireName)
    if (hireTasks.length === 0) return
    const currentIdx = Math.min(...hireTasks.map((t) => phaseOrder.indexOf(t.phase)))
    const nextPhase = phaseOrder[currentIdx + 1]
    if (!nextPhase) return
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.hireName === hireName ? { ...t, phase: nextPhase, done: false } : t,
      ),
    }))
    notify.success(`${hireName} → ${nextPhase}`, "Moved to the next onboarding phase.")

  }

  return (
    <DashboardShell activeHref="/onboarding" current="Onboarding" accentCurrent>
      <OnboardingHeader
        onExport={() => {
          exportToCsv("onboarding", state.tasks, [
            { key: "hireName", label: "New hire" },
            { key: "hireRole", label: "Role" },
            { key: "hireDept", label: "Department" },
            { key: "phase", label: "Phase" },
            { key: "label", label: "Task" },
            { key: "done", label: "Completed" },
          ])
          notify.success("Onboarding exported", `${state.tasks.length} tasks downloaded as CSV.`)
        }}
        onAddNewHire={
          canWrite
            ? () => {
              if (user?.role === "manager" && user.department) setHireDept(user.department)
              setAddOpen(true)
            }
            : undefined
        }
      />
      <OnboardingKpiStrip tasks={state.tasks} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <OnboardingJourney
          tasks={state.tasks}
          onToggleTask={canWrite ? handleToggleTask : undefined}
          onAdvanceHire={canWrite ? handleAdvanceHire : undefined}
          onDeleteTask={
            canWrite
              ? (id) => {
                  const t = state.tasks.find((x) => x.id === id)
                  if (t) setDeleteTask(t)
                }
              : undefined
          }
        />
        <div className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
          <ProgressByPhase tasks={state.tasks} />
          <OnboardingByDept tasks={state.tasks} />
        </div>
      </div>
      <ActionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add new hire"
        submitLabel="Add"
        onSubmit={() => {
          if (!hireName.trim() || !hireRole.trim() || !hireDept.trim()) {
            notify.error("Please fill in all fields")
            return
          }
          const init = hireName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
          const newId = `ob-${Date.now()}`
          setState((prev) => ({
            ...prev,
            tasks: [
              ...prev.tasks,
              {
                id: newId,
                hireInit: init,
                hireName: hireName.trim(),
                hireRole: hireRole.trim(),
                hireDept: hireDept.trim(),
                phase: "pre" as const,
                done: false,
                label: "Paperwork pending",
              },
            ],
          }))
          notify.success(`${hireName.trim()} added to onboarding`)

          setAddOpen(false)
          setHireName("")
          setHireRole("")
          setHireDept("")
        }}
      >
        <Field
          label="Full name"
          value={hireName}
          onChange={setHireName}
          placeholder="e.g. Alex Chen"
          required
        />
        <Field
          label="Role"
          value={hireRole}
          onChange={setHireRole}
          placeholder="e.g. Frontend Engineer"
          required
        />
        <SelectField
          label="Department"
          value={hireDept}
          onChange={setHireDept}
          options={hireDeptOptions.map((d) => ({ value: d, label: d }))}
          required
        />
      </ActionDialog>
      <ConfirmDialog
        open={!!deleteTask}
        onOpenChange={(o) => { if (!o) setDeleteTask(null) }}
        title="Delete onboarding task"
        description={deleteTask ? `Delete “${deleteTask.label}” for ${deleteTask.hireName}? This can’t be undone.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTask) {
            setState((prev) => ({
              tasks: prev.tasks.filter((t) => t.id !== deleteTask.id),
            }))
            notify.success("Task deleted", `Removed “${deleteTask.label}”.`)

          }
          setDeleteTask(null)
        }}
      />
    </DashboardShell>
  )
}
