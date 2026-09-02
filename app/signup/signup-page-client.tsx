"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { z } from "zod"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { AuthInput } from "@/components/auth/auth-input"
import { useAuth } from "@/hooks/use-auth"
import { notify } from "@/lib/toast"

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid work email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string().min(1, "Confirm your password."),
    agree: z.boolean(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don’t match.",
  })
  .refine((d) => d.agree === true, {
    path: ["agree"],
    message: "Please accept the Terms and Privacy Policy.",
  })

type FormValues = { name: string; email: string; password: string; confirm: string; agree: boolean }
type FormErrors = Partial<Record<keyof FormValues, string>>

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true"

export function SignupPageClient() {
  const router = useRouter()
  const { signup, loginWithGoogle, isAuthenticated, hydrated } = useAuth()
  const [values, setValues] = React.useState<FormValues>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
  })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [showPassword, setShowPassword] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/dashboard")
  }, [hydrated, isAuthenticated, router])

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    setFormError(null)
  }

  const strength = values.password.length >= 12 ? "Strong" : values.password.length >= 8 ? "Good" : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setSubmitting(true)
    const result = await signup(parsed.data.name, parsed.data.email, parsed.data.password)
    setSubmitting(false)
    if (!result.ok) {
      setFormError(result.error)
      notify.error("Couldn’t create account", result.error)
      return
    }
    notify.success("Account created", "Welcome to PeopleHR.")
    router.replace("/dashboard")
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
    router.replace("/dashboard")
  }

  return (
    <div className="flex min-h-svh w-full bg-background">
      <div className="hidden lg:flex">
        <AuthBrandPanel
          quote="Great teams are not managed — they are cared for, one person at a time."
          authorName="Maya Reinhardt"
          authorRole="On the heart of people ops"
          authorInitials="MR"
        />
      </div>

      <div className="flex h-full flex-1 flex-col items-center justify-center px-6 py-10 sm:px-16">
        <div className="flex w-full max-w-[380px] flex-col">
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-h1">
              Create your account
            </h1>
            <p className="font-sans text-[15px] leading-normal text-secondary-foreground">
              Start your free 14-day trial — no card required.
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
                  Sign up with Google
                </span>
              </button>
            ) : null}

            {GOOGLE_ENABLED ? (
              <div className="my-1 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-sans text-xs text-muted-foreground">
                  or sign up with email
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            ) : null}

            <AuthInput
              label="Full name"
              type="text"
              placeholder="Maya Reinhardt"
              autoComplete="name"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              error={errors.name}
            />

            <AuthInput
              label="Work email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
            />

            <AuthInput
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
            {strength ? (
              <span className="-mt-1 font-sans text-[11px] text-secondary-foreground">
                Password strength: {strength}
              </span>
            ) : null}

            <AuthInput
              label="Confirm password"
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password"
              autoComplete="new-password"
              value={values.confirm}
              onChange={(e) => update("confirm", e.target.value)}
              error={errors.confirm}
            />

            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={values.agree}
                onChange={(e) => update("agree", e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="font-sans text-xs leading-normal text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="underline hover:text-secondary-foreground">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-secondary-foreground">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.agree ? (
              <span className="font-sans text-[11px] text-foreground">{errors.agree}</span>
            ) : null}

            {formError ? (
              <div className="rounded-lg border border-border bg-muted px-3.5 py-2.5 font-sans text-[12.5px] text-foreground">
                {formError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-sans text-[15px] font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              Create account
              <ArrowRight className="size-[17px]" strokeWidth={2} />
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-1.5">
            <span className="font-sans text-sm text-muted-foreground">
              Already have an account?
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
