"use client"

import * as React from "react"
import { z } from "zod"

import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, useForm } from "@/components/shared/field"
import { apiRequest } from "@/lib/api-client"
import { notify } from "@/lib/toast"

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(8, "New password must be at least 8 characters."),
    confirm: z.string().min(1, "Confirm your new password."),
  })
  .refine((d) => d.next === d.confirm, {
    path: ["confirm"],
    message: "Passwords don’t match.",
  })

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({ current: "", next: "", confirm: "" })

  const onSubmit = async () => {
    const parsed = schema.safeParse(form.values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      form.setErrors(fieldErrors as never)
      return
    }
    setSubmitting(true)
    try {
      const res = await apiRequest<{ ok: boolean; error?: string }>("/api/user/password", {
        method: "POST",
        body: { current: parsed.data.current, next: parsed.data.next },
      })
      if (!res.ok) throw new Error(res.error ?? "Could not update password.")
      notify.success("Password updated", "Your password has been changed.")
      form.reset({ current: "", next: "", confirm: "" })
      onOpenChange(false)
    } catch (err) {
      notify.error("Couldn’t update password", err instanceof Error ? err.message : "Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Change password"
      description="We'll verify your current password before updating it."
      submitLabel="Update password"
      submitting={submitting}
      onSubmit={onSubmit}
    >
      <Field
        label="Current password"
        type="password"
        value={form.values.current}
        onChange={(v) => form.setValue("current", v)}
        required
        error={form.errors.current}
      />
      <Field
        label="New password"
        type="password"
        value={form.values.next}
        onChange={(v) => form.setValue("next", v)}
        required
        error={form.errors.next}
      />
      <Field
        label="Confirm new password"
        type="password"
        value={form.values.confirm}
        onChange={(v) => form.setValue("confirm", v)}
        required
        error={form.errors.confirm}
      />
    </ActionDialog>
  )
}
