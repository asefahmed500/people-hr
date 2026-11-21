"use client"

import * as React from "react"
import { z } from "zod"
import { Megaphone, Pin, PinOff, Plus, Trash2 } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Field, SelectField, TextArea, useForm } from "@/components/shared/field"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { notify } from "@/lib/toast"
import { DEPARTMENTS } from "@/lib/data/types"
import {
  defaultAnnouncementsStore,
  type Announcement,
  type AnnouncementsStore,
} from "@/lib/data"

const announcementSchema = z.object({
  title: z.string().min(3, "Title is required"),
  body: z.string().min(5, "Write the announcement body"),
  audience: z.string(),
})

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const audienceOptions = [
  { value: "all", label: "Everyone" },
  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
]

export function AnnouncementsPageClient() {
  const { state, setState, hydrated, error, retry } = useApiStore<AnnouncementsStore>(
    "/api/store/announcements",
    () => defaultAnnouncementsStore,
  )
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [composeOpen, setComposeOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Announcement | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const form = useForm({ title: "", body: "", audience: "all" })

  React.useEffect(() => {
    if (composeOpen) form.reset({ title: "", body: "", audience: "all" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composeOpen])

  function handleCompose() {
    const parsed = announcementSchema.safeParse(form.values)
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
      const announcement: Announcement = {
        id: `an-${Date.now()}`,
        title: parsed.data.title.trim(),
        body: parsed.data.body.trim(),
        author: user?.name ?? "HR",
        audience: parsed.data.audience === "all" ? undefined : parsed.data.audience,
        pinned: false,
        createdAt: Date.now(),
      }
      setState((prev) => ({ ...prev, announcements: [announcement, ...prev.announcements] }))
      notify.success("Announcement posted", announcement.title)
      setComposeOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  function togglePin(target: Announcement) {
    setState((prev) => ({
      ...prev,
      announcements: prev.announcements.map((a) =>
        a.id === target.id ? { ...a, pinned: !a.pinned } : a,
      ),
    }))
  }

  function handleDelete() {
    if (!deleteTarget) return
    setState((prev) => ({
      ...prev,
      announcements: prev.announcements.filter((a) => a.id !== deleteTarget.id),
    }))
    notify.success("Announcement removed")
    setDeleteTarget(null)
  }

  if (error) {
    return (
      <DashboardShell activeHref="/announcements" current="Announcements">
        <StoreErrorState onRetry={retry} />
      </DashboardShell>
    )
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/announcements" current="Announcements">
        <Skeleton className="h-8 w-[220px] rounded-lg" />
        <Skeleton className="mt-4 h-24 w-full rounded-lg" />
        <Skeleton className="mt-5 h-[300px] w-full rounded-lg" />
      </DashboardShell>
    )
  }

  const sorted = [...state.announcements].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt,
  )

  return (
    <>
      <DashboardShell activeHref="/announcements" current="Announcements">
        <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-h1">Announcements</h1>
            <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
              Company-wide updates and notices from the People team
            </p>
          </div>
          {isAdmin ? (
            <Button size="lg" onClick={() => setComposeOpen(true)}>
              <Plus className="size-4" strokeWidth={2} />
              New announcement
            </Button>
          ) : null}
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted py-16">
            <Megaphone className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="font-sans text-sm font-medium text-foreground">No announcements yet</p>
            <p className="font-sans text-[12.5px] text-muted-foreground">
              {isAdmin
                ? "Post the first company update with the button above."
                : "Updates from HR will appear here."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((a) => (
              <article
                key={a.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {a.pinned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 font-sans text-[11px] font-semibold text-background">
                        <Pin className="size-3" />
                        Pinned
                      </span>
                    ) : null}
                    {a.audience ? (
                      <span className="inline-block rounded-full bg-muted px-2 py-0.5 font-sans text-[11px] font-medium text-secondary-foreground">
                        {a.audience}
                      </span>
                    ) : null}
                  </div>
                  {isAdmin ? (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" size="icon-sm" title={a.pinned ? "Unpin" : "Pin"} aria-label={a.pinned ? "Unpin announcement" : "Pin announcement"} onClick={() => togglePin(a)}>
                        {a.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Delete" aria-label="Delete announcement" onClick={() => setDeleteTarget(a)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <h2 className="text-h4">{a.title}</h2>
                <p className="whitespace-pre-line font-sans text-[13.5px] leading-relaxed text-secondary-foreground">
                  {a.body}
                </p>
                <span className="font-sans text-[11.5px] text-muted-foreground">
                  {a.author} Â· {fmtDate(a.createdAt)}
                </span>
              </article>
            ))}
          </div>
        )}
      </DashboardShell>

      <ActionDialog width="wide"
        open={composeOpen}
        onOpenChange={setComposeOpen}
        title="New announcement"
        description={form.values.audience === "all" ? "Everyone in the workspace will see this." : `Only the ${form.values.audience} department will see this.`}
        submitLabel="Post announcement"
        submitting={submitting}
        onSubmit={handleCompose}
      >
        <Field
          label="Title"
          value={form.values.title}
          onChange={(v) => form.setValue("title", v)}
          placeholder="e.g. Office closed on Friday"
          required
          error={form.errors.title}
        />
        <TextArea
          label="Body"
          value={form.values.body}
          onChange={(v) => form.setValue("body", v)}
          placeholder="Write the announcementâ€¦"
          rows={5}
          error={form.errors.body}
        />
        <SelectField
          label="Audience"
          value={form.values.audience}
          onChange={(v) => form.setValue("audience", v)}
          options={audienceOptions}
        />
      </ActionDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete â€œ${deleteTarget?.title ?? ""}â€?`}
        description="This permanently removes the announcement for everyone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  )
}
