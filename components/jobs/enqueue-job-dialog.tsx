"use client"

import * as React from "react"

import { ActionDialog } from "@/components/shared/dialog-parts"
import { SelectField, TextArea, useForm } from "@/components/shared/field"
import { JOB_TYPES, isRecord } from "./types"

const INITIAL_FORM = { type: "report.schedule_check", payload: "{}" }

type EnqueueJobDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  submitting: boolean
  onSubmit: (values: { type: string; payload: Record<string, unknown> }) => void
}

export function EnqueueJobDialog({
  open,
  onOpenChange,
  submitting,
  onSubmit,
}: EnqueueJobDialogProps) {
  const form = useForm(INITIAL_FORM)

  React.useEffect(() => {
    if (open) form.reset()
    // The form instance is stable for the dialog's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSubmit() {
    let parsed: unknown
    try {
      parsed = JSON.parse(form.values.payload)
    } catch {
      form.setErrors({ payload: "Enter valid JSON." })
      return
    }
    if (!isRecord(parsed)) {
      form.setErrors({ payload: "Payload must be a JSON object." })
      return
    }
    onSubmit({ type: form.values.type, payload: parsed })
  }

  return (
    <ActionDialog width="wide"
      open={open}
      onOpenChange={onOpenChange}
      title="Enqueue job"
      description="Add a background job to the queue for a worker to pick up."
      submitLabel="Enqueue"
      submitting={submitting}
      onSubmit={handleSubmit}
    >
      <SelectField
        label="Job type"
        value={form.values.type}
        onChange={(value) => form.setValue("type", value)}
        options={JOB_TYPES}
      />
      <TextArea
        label="Payload (JSON)"
        value={form.values.payload}
        onChange={(value) => form.setValue("payload", value)}
        rows={6}
        placeholder={'{ "reportId": "..." }'}
        error={form.errors.payload}
      />
      <p className="font-sans text-[11.5px] leading-normal text-muted-foreground">
        Enter a JSON object with the details the worker needs. Leave {"{}"} for
        jobs that take no arguments.
      </p>
    </ActionDialog>
  )
}
