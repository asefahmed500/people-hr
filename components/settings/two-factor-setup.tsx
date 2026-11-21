"use client"

import * as React from "react"
import { z } from "zod"

import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, useForm } from "@/components/shared/field"
import { apiRequest } from "@/lib/api-client"
import { notify } from "@/lib/toast"

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  onEnabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnabled: () => void
}) {
  const [phase, setPhase] = React.useState<"loading" | "scan" | "verify">("loading")
  const [qr, setQr] = React.useState("")
  const [secret, setSecret] = React.useState("")
  const [backupCodes, setBackupCodes] = React.useState<string[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({ code: "" })

  const start = async () => {
    setPhase("loading")
    try {
      const res = await apiRequest<{
        ok: boolean
        qr: string
        secret: string
        backupCodes: string[]
      }>("/api/auth/2fa/setup", { method: "POST" })
      setQr(res.qr)
      setSecret(res.secret)
      setBackupCodes(res.backupCodes)
      setPhase("scan")
    } catch (err) {
      notify.error("Couldn’t start setup", err instanceof Error ? err.message : "Please try again.")
      onOpenChange(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      form.reset({ code: "" })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const verify = async () => {
    const parsed = z.string().min(6).safeParse(form.values.code.trim())
    if (!parsed.success) {
      notify.error("Enter the 6-digit code", "Use the code shown in your authenticator app.")
      return
    }
    setSubmitting(true)
    try {
      const res = await apiRequest<{ ok: boolean; error?: string }>("/api/auth/2fa/enable", {
        method: "POST",
        body: { token: parsed.data },
      })
      if (!res.ok) throw new Error(res.error ?? "Could not enable 2FA.")
      notify.success("2FA enabled", "Your account now requires a code to sign in.")
      onEnabled()
      onOpenChange(false)
    } catch (err) {
      notify.error("Code didn’t match", err instanceof Error ? err.message : "Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Set up two-factor authentication"
      description="Scan the QR code with your authenticator app, then confirm with a code."
      submitLabel="Verify code"
      submitting={submitting}
      onSubmit={verify}
    >
      {phase === "scan" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Scan this QR code with your authenticator app" className="mx-auto size-48 rounded-lg border border-border" />
          <p className="text-center font-sans text-[12px] leading-normal text-muted-foreground">
            Can’t scan? Manual key: <span className="font-mono text-secondary-foreground">{secret}</span>
          </p>
          <Field
            label="6-digit code"
            placeholder="123456"
            value={form.values.code}
            onChange={(v) => form.setValue("code", v)}
            required
          />
          <div className="rounded-lg border border-border bg-muted p-3">
            <p className="mb-2 font-sans text-[12px] font-semibold text-foreground">
              Save these backup codes — each can be used once.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {backupCodes.map((code) => (
                <span key={code} className="rounded bg-card px-2 py-1 text-center font-mono text-[11px] text-secondary-foreground">
                  {code}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="py-4 text-center font-sans text-[13px] text-muted-foreground">
          Loading your QR code…
        </p>
      )}
    </ActionDialog>
  )
}

export function TwoFactorDisableDialog({
  open,
  onOpenChange,
  onDisabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisabled: () => void
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const form = useForm({ password: "" })

  const disable = async () => {
    if (!form.values.password) {
      notify.error("Enter your password", "Your password is required to disable 2FA.")
      return
    }
    setSubmitting(true)
    try {
      const res = await apiRequest<{ ok: boolean; error?: string }>("/api/auth/2fa/disable", {
        method: "POST",
        body: { password: form.values.password },
      })
      if (!res.ok) throw new Error(res.error ?? "Could not disable 2FA.")
      notify.success("2FA disabled", "You’ll only need your password to sign in.")
      onDisabled()
      onOpenChange(false)
    } catch (err) {
      notify.error("Couldn’t disable 2FA", err instanceof Error ? err.message : "Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Turn off two-factor authentication"
      description="Enter your password to confirm."
      submitLabel="Turn off 2FA"
      submitting={submitting}
      onSubmit={disable}
    >
      <Field
        label="Password"
        type="password"
        value={form.values.password}
        onChange={(v) => form.setValue("password", v)}
        required
      />
    </ActionDialog>
  )
}
