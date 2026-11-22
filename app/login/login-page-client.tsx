"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Eye, EyeOff, Globe } from "lucide-react"
import { z } from "zod"

import { AuthInput } from "@/components/auth/auth-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { notify } from "@/lib/toast"
import { DEMO_ACCOUNTS } from "@/lib/data"

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
  const [demoAccountId, setDemoAccountId] = React.useState("")

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

  const selectedDemo = DEMO_ACCOUNTS.find((a) => a.id === demoAccountId)

  const applyDemoAccount = (id: string) => {
    const account = DEMO_ACCOUNTS.find((a) => a.id === id)
    if (!account) return
    setValues({ email: account.email, password: account.password })
    setErrors({})
    setFormError(null)
    setTwoFactorStep(false)
    setTwoFactorCode("")
    notify.info("Demo account selected", `${account.label} credentials filled in. Press Sign in.`)
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
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full"
              >
                <Globe className="size-4 text-foreground" strokeWidth={2} aria-hidden="true" />
                Continue with Google
              </Button>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" strokeWidth={2} />
                    ) : (
                      <Eye className="size-4" strokeWidth={2} />
                    )}
                  </Button>
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
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setTwoFactorStep(false)
                    setTwoFactorCode("")
                    setFormError(null)
                  }}
                  className="self-start"
                >
                  <ArrowLeft className="button-arrow size-4" strokeWidth={2} aria-hidden="true" />
                  Back to password
                </Button>
              </>
            ) : null}

            <Button
              type="submit"
              loading={submitting}
              loadingText={twoFactorStep ? "Verifying…" : "Signing in…"}
              className="mt-1 w-full"
            >
              {twoFactorStep ? "Verify code" : "Sign in"}
              <ArrowRight className="button-arrow size-4" strokeWidth={2} aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-2">
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Demo accounts
            </span>
            <Select
              value={demoAccountId}
              onValueChange={(id) => {
                setDemoAccountId(id)
                applyDemoAccount(id)
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-lg" aria-label="Choose a demo account">
                <SelectValue placeholder="Choose a role to fill credentials" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_ACCOUNTS.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{account.label}</span>
                      <span className="text-[11px] text-muted-foreground">{account.email}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="font-sans text-[11px] leading-normal text-muted-foreground">
              {selectedDemo
                ? `${selectedDemo.description} — credentials filled in.`
                : "Select a role to fill the form, then press Sign in."}
            </p>
          </div>

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
