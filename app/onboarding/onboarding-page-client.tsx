"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { OnboardingKpiStrip } from "@/components/onboarding/onboarding-kpi-strip"
import { OnboardingJourney } from "@/components/onboarding/onboarding-journey"
import { ProgressByPhase } from "@/components/onboarding/progress-by-phase"
import { OnboardingByDept } from "@/components/onboarding/onboarding-by-dept"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field } from "@/components/shared/field"
import { Skeleton } from "@/components/ui/skeleton"
import { useMockStore } from "@/hooks/use-mock-store"
import { STORAGE_KEYS, defaultOnboardingStore, defaultNotificationsStore, newNotification, type NotificationsStore, type Notification } from "@/lib/data"
import type { OnboardingStore } from "@/lib/data"
import { notify } from "@/lib/toast"

export function OnboardingPageClient() {
  const { state, setState, hydrated } = useMockStore<OnboardingStore>(
    STORAGE_KEYS.onboarding,
    () => defaultOnboardingStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }
  const [addOpen, setAddOpen] = useState(false)
  const [hireName, setHireName] = useState("")
  const [hireRole, setHireRole] = useState("")
  const [hireDept, setHireDept] = useState("")

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/onboarding" current="Onboarding" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <div className="mt-4 flex gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] flex-1 rounded-[18px]" />
          ))}
        </div>
        <div className="mt-5 flex gap-5">
          <Skeleton className="h-[400px] flex-1 rounded-[18px]" />
          <div className="flex w-[340px] shrink-0 flex-col gap-5">
            <Skeleton className="h-[300px] rounded-[18px]" />
            <Skeleton className="h-[250px] rounded-[18px]" />
          </div>
        </div>
      </DashboardShell>
    )
  }

  const handleToggleTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    }))
  }

  return (
    <DashboardShell activeHref="/onboarding" current="Onboarding" accentCurrent>
      <OnboardingHeader
        onThisMonth={() => notify.info("Month view")}
        onExport={() => notify.success("Onboarding data exported")}
        onAddNewHire={() => setAddOpen(true)}
      />
      <OnboardingKpiStrip tasks={state.tasks} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <OnboardingJourney tasks={state.tasks} onToggleTask={handleToggleTask} />
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
          addNotification({ type: "new_hire_added", title: "New hire added", description: `${hireName.trim()} added to onboarding`, href: "/onboarding" })
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
        <Field
          label="Department"
          value={hireDept}
          onChange={setHireDept}
          placeholder="e.g. Engineering"
          required
        />
      </ActionDialog>
    </DashboardShell>
  )
}
