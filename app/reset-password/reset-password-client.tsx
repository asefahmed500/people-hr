"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { z } from "zod"

import { AuthInput } from "@/components/auth/auth-input"
import { apiRequest } from "@/lib/api-client"
import { notify } from "@/lib/toast"

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string().min(1, "Confirm your new password."),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don’t match.",
  })

export function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError("This reset link is invalid. Request a new one.")
      return
    }
    const parsed = schema.safeParse({ password, confirm })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your password.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiRequest<{ ok: boolean; error?: string }>("/api/auth/reset-password", {
        method: "POST",
        body: { token, password: parsed.data.password },
      })
      if (!res.ok) throw new Error(res.error ?? "Could not reset password.")
      setSubmitting(false)
      notify.success("Password reset", "Sign in with your new password.")
      router.replace("/login")
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : "Please try again.")
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-[380px] flex-col">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-h1">
            Choose a new password
          </h1>
          <p className="font-sans text-[15px] leading-normal text-secondary-foreground">
            Pick something strong and unique.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
          />
          <AuthInput
            label="Confirm new password"
            type="password"
            placeholder="Repeat your new password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              setError(null)
            }}
          />
          {error ? (
            <div className="rounded-lg border border-border bg-muted px-3.5 py-2.5 font-sans text-[12.5px] text-foreground">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-sans text-[15px] font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            Set new password
            <ArrowRight className="size-[17px]" strokeWidth={2} />
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-1.5">
          <span className="font-sans text-sm text-muted-foreground">
            Remembered it?
          </span>
          <Link
            href="/login"
            className="font-sans text-sm font-semibold text-primary transition-colors hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
