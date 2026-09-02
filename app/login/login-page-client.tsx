"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { z } from "zod"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { AuthInput } from "@/components/auth/auth-input"
import { useAuth } from "@/hooks/use-auth"
import { notify } from "@/lib/toast"
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/data"

const schema = z.object({
  email: z.string().email("Enter a valid work email."),
  password: z.string().min(1, "Enter your password."),
})

type FormValues = { email: string; password: string }
type FormErrors = Partial<Record<keyof FormValues, string>>

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true"

function safeCallback(cb: string | null): string {
  if (
    cb &&
    cb.startsWith("/") &&
    !cb.startsWith("//") &&
    !cb.startsWith("/\\") &&
    !cb.startsWith("/login") &&
    !cb.startsWith("/signup") &&
    !cb.startsWith("/api/")
  ) {
    return cb
  }
  return "/dashboard"
}

export function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loginWithGoogle, isAuthenticated, hydrated } = useAuth()
  const [values, setValues] = React.useState<FormValues>({ email: "", password: "" })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [showPassword, setShowPassword] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [twoFactorStep, setTwoFactorStep] = React.useState(false)
  const [twoFactorCode, setTwoFactorCode] = React.useState("")

  React.useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(safeCallback(searchParams.get("callbackUrl")))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated, router])

  const update = (key: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (twoFactorStep) {
      if (!twoFactorCode.trim()) {
        setFormError("Enter your 2FA code.")
        return
      }
      setSubmitting(true)
      const result = await login(values.email, values.password, twoFactorCode.trim())
      setSubmitting(false)
      if (!result.ok) {
        setFormError(result.error || "Incorrect code.")
        notify.error("Couldn’t sign in", result.error || "Incorrect 2FA code.")
        return
      }
      notify.success("Welcome back", "Signed in to your workspace.")
      router.replace(safeCallback(searchParams.get("callbackUrl")))
      return
    }

    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setSubmitting(true)
    const result = await login(parsed.data.email, parsed.data.password)
    setSubmitting(false)
    if (!result.ok && result.twoFactorRequired) {
      setTwoFactorStep(true)
      setFormError(null)
      return
    }
    if (!result.ok) {
      setFormError(result.error)
      notify.error("Couldn’t sign in", result.error)
      return
    }
    notify.success("Welcome back", "Signed in to your workspace.")
    router.replace(safeCallback(searchParams.get("callbackUrl")))
  }

  const handleGoogle = async () => {
    if (!GOOGLE_ENABLED) return
    setSubmitting(true)
    const result = await loginWithGoogle()
    setSubmitting(false)
    if (!result.ok) {
      notify.error("Couldn’t sign in", result.error)
      return
    }
    router.replace(safeCallback(searchParams.get("callbackUrl")))
  }

  const fillDemo = () => {
    setValues({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
    setErrors({})
    setFormError(null)
  }

  return (
    <div className="flex min-h-svh w-full bg-background">
      <div className="hidden lg:flex">
        <AuthBrandPanel
          quote="Take care of your people, and they will take care of everything else."
          authorName="Maya Reinhardt"
          authorRole="On building people-first teams"
          authorInitials="MR"
        />
      </div>

      <div className="flex h-full flex-1 flex-col items-center justify-center px-6 py-10 sm:px-16">
        <div className="flex w-full max-w-[380px] flex-col">
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-h1">
              Welcome back
            </h1>
            <p className="font-sans text-[15px] leading-normal text-secondary-foreground">
              Sign in to your PeopleHR workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {GOOGLE_ENABLED ? (
              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card px-4 py-0 shadow-card transition-colors hover:bg-muted disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <svg className="size-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                <span className="font-sans text-sm font-semibold text-secondary-foreground">
                  Continue with Google
                </span>
              </button>
            ) : null}

            {GOOGLE_ENABLED ? (
              <div className="my-1 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-sans text-xs text-muted-foreground">
                  or sign in with email
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            ) : null}

            <AuthInput
              label="Work email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
            />

            <div className="flex w-full flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[13px] font-semibold leading-normal text-secondary-foreground">
                  Password
                </span>
                <Link
                  href="/forgot-password"
                  className="font-sans text-[13px] font-semibold leading-normal text-primary transition-colors hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <AuthInput
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••"
                value={values.password}
                onChange={(e) => update("password", e.target.value)}
                error={errors.password}
                trailing={
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" strokeWidth={2} />
                    ) : (
                      <Eye className="size-4" strokeWidth={2} />
                    )}
                  </button>
                }
              />
            </div>

            {formError ? (
              <div className="rounded-lg border border-border bg-muted px-3.5 py-2.5 font-sans text-[12.5px] text-foreground">
                {formError}
              </div>
            ) : null}

            {twoFactorStep ? (
              <>
                <AuthInput
                  label="2FA code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value)
                    setFormError(null)
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorStep(false)
                    setTwoFactorCode("")
                    setFormError(null)
                  }}
                  className="self-start font-sans text-[13px] font-semibold leading-normal text-primary hover:text-primary"
                >
                  ← Back to password
                </button>
              </>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-sans text-[15px] font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {twoFactorStep ? "Verify code" : "Sign in"}
              <ArrowRight className="size-[17px]" strokeWidth={2} />
            </button>
          </form>

          <button
            type="button"
            onClick={fillDemo}
            className="mt-4 rounded-lg border border-dashed border-border px-4 py-2.5 text-center font-sans text-[12.5px] text-muted-foreground transition-colors hover:bg-muted"
          >
            Demo account — <span className="text-foreground">{DEMO_EMAIL}</span> / <span className="text-foreground">{DEMO_PASSWORD}</span>
            <span className="block text-[11px]">Click to fill, then Sign in.</span>
          </button>

          <div className="mt-8 flex items-center justify-center gap-1.5">
            <span className="font-sans text-sm text-muted-foreground">
              New to PeopleHR?
            </span>
            <Link
              href="/signup"
              className="font-sans text-sm font-semibold text-primary transition-colors hover:text-primary"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
