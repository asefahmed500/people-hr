"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Eye, EyeOff, Globe } from "lucide-react"
import { z } from "zod"

import { AuthInput } from "@/components/auth/auth-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
    // Clean, centred auth screen — no marketing panel or decorative copy.
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-5 py-10">
      <div className="flex w-full max-w-[360px] flex-col">
        <div className="mb-6 flex flex-col gap-1.5">
          <span className="font-sans text-[13px] font-semibold tracking-tight text-foreground">PeopleHR</span>
          <h1 className="text-h1">Sign in</h1>
        </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {GOOGLE_ENABLED ? (
              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="flex h-9 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-card px-4 transition-colors hover:bg-muted disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Globe className="size-4 text-foreground" strokeWidth={2} aria-hidden="true" />
                <span className="font-sans text-sm font-medium text-secondary-foreground">
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
              <AuthInput
                label="Password"
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
              <Link
                href="/forgot-password"
                className="self-end font-sans text-[12.5px] font-medium text-primary transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {formError ? (
              <Alert className="bg-muted font-sans text-[12.5px] text-foreground">
                <AlertDescription className="font-sans text-[12.5px] text-foreground">
                  {formError}
                </AlertDescription>
              </Alert>
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
                  className="flex items-center gap-1.5 self-start font-sans text-[13px] font-semibold leading-normal text-primary hover:text-primary"
                >
                  <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
                  Back to password
                </button>
              </>
            ) : null}

            <Button type="submit" disabled={submitting} className="mt-1 w-full">
              {twoFactorStep ? "Verify code" : "Sign in"}
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Button>
          </form>

          <button
            type="button"
            onClick={fillDemo}
            className="mt-4 rounded-md border border-dashed border-border px-4 py-2.5 text-center font-sans text-[12.5px] text-muted-foreground transition-colors hover:bg-muted"
          >
            Demo account — <span className="text-foreground">{DEMO_EMAIL}</span> / <span className="text-foreground">{DEMO_PASSWORD}</span>
            <span className="block text-[11px]">Click to fill, then Sign in.</span>
          </button>

          <Link
            href="/signup"
            className="mt-6 text-center font-sans text-[13px] font-medium text-primary transition-colors hover:underline"
          >
            Create an account
          </Link>
      </div>
    </div>
  )
}
