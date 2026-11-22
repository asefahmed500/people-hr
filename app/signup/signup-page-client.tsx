"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Globe } from "lucide-react"
import { z } from "zod"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { AuthInput } from "@/components/auth/auth-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full"
              >
                <Globe className="size-4 text-foreground" strokeWidth={2} aria-hidden="true" />
                Sign up with Google
              </Button>
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

            <label htmlFor="signup-agree" className="flex items-start gap-2.5">
              <Checkbox
                id="signup-agree"
                checked={values.agree}
                onCheckedChange={(checked) => update("agree", checked === true)}
                className="mt-0.5"
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
              <Alert className="bg-muted font-sans text-[12.5px] text-foreground">
                <AlertDescription className="font-sans text-[12.5px] text-foreground">
                  {formError}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              loading={submitting}
              loadingText="Creating account…"
              className="mt-1 w-full"
            >
              Create account
              <ArrowRight className="button-arrow size-4" strokeWidth={2} aria-hidden="true" />
            </Button>
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
