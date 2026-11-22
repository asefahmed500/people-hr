"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { z } from "zod"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { AuthInput } from "@/components/auth/auth-input"
import { Button } from "@/components/ui/button"
import { apiRequest, ApiError } from "@/lib/api-client"
import { notify } from "@/lib/toast"

const schema = z.object({ email: z.string().email("Enter a valid work email.") })

export function ForgotPasswordClient() {
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [resetUrl, setResetUrl] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiRequest<{ ok: boolean; resetUrl?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      })
      setSubmitting(false)
      // Dev mode: no email transport, so show the reset link so the flow works.
      if (res.resetUrl) {
        setResetUrl(res.resetUrl)
      } else {
        notify.success("Check your inbox", "If that account exists, a reset link is on its way.")
      }
    } catch (err) {
      setSubmitting(false)
      const message = err instanceof ApiError ? err.message : "Please try again."
      setError(message)
      notify.error("Couldn’t send reset", message)
    }
  }

  return (
    <div className="flex min-h-svh w-full bg-background">
      <div className="hidden lg:flex">
        <AuthBrandPanel
          quote="Every great people team starts with one good password reset."
          authorName="PeopleHR Support"
          authorRole="On account security"
          authorInitials="PS"
        />
      </div>

      <div className="flex h-full flex-1 flex-col items-center justify-center px-6 py-10 sm:px-16">
        <div className="flex w-full max-w-[380px] flex-col">
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-h1">
              Reset your password
            </h1>
            <p className="font-sans text-[15px] leading-normal text-secondary-foreground">
              Enter your work email and we’ll send you a reset link.
            </p>
          </div>

          {resetUrl ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-muted px-4 py-3">
                <p className="font-sans text-[12.5px] leading-normal text-secondary-foreground">
                  Reset link generated (no email server is configured, so it’s shown here):
                </p>
                <a
                  href={resetUrl}
                  className="mt-1 block break-all font-sans text-[12.5px] font-medium leading-normal text-primary underline"
                >
                  {resetUrl}
                </a>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">
                  Back to sign in
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AuthInput
                label="Work email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                error={error ?? undefined}
              />
              <Button
                type="submit"
                loading={submitting}
                loadingText="Sending…"
                className="mt-1 w-full"
              >
                Send reset link
                <ArrowRight className="button-arrow size-4" strokeWidth={2} aria-hidden="true" />
              </Button>
            </form>
          )}

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
    </div>
  )
}
