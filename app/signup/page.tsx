import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { AuthGoogleButton } from "@/components/auth/auth-google-button"
import { AuthInput } from "@/components/auth/auth-input"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh w-full bg-[#faf9f5]">
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
            <h1 className="font-display text-[34px] font-semibold leading-normal tracking-[-0.6px] text-[#1f2a26]">
              Create your account
            </h1>
            <p className="font-sans text-[15px] leading-normal text-[#5b655e]">
              Start your free 14-day trial — no card required.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <AuthGoogleButton label="Sign up with Google" />

            <div className="my-1 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ece9e2]" />
              <span className="font-sans text-xs text-[#a7ada6]">
                or sign up with email
              </span>
              <div className="h-px flex-1 bg-[#ece9e2]" />
            </div>

            <AuthInput
              label="Full name"
              type="text"
              placeholder="Maya Reinhardt"
              autoComplete="name"
            />

            <AuthInput
              label="Work email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
            />

            <AuthInput
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />

            <Link
              href="/"
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-[11px] bg-[#2f6f61] font-sans text-[15px] font-semibold text-white shadow-[0px_10px_24px_rgba(47,111,97,0.28)] transition-colors hover:bg-[#286253]"
            >
              Create account
              <ArrowRight className="size-[17px]" strokeWidth={2} />
            </Link>

            <p className="mt-0.5 text-center font-sans text-xs text-[#a7ada6]">
              By creating an account you agree to our{" "}
              <Link href="/signup#terms" className="underline hover:text-[#5b655e]">
                Terms
              </Link>{" "}
              &amp;{" "}
              <Link href="/signup#privacy" className="underline hover:text-[#5b655e]">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-1.5">
            <span className="font-sans text-sm text-[#8a948d]">
              Already have an account?
            </span>
            <Link
              href="/login"
              className="font-sans text-sm font-semibold text-[#2f6f61] transition-colors hover:text-[#286253]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
