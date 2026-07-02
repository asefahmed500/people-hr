import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { AuthGoogleButton } from "@/components/auth/auth-google-button"
import { AuthInput } from "@/components/auth/auth-input"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full bg-[#faf9f5]">
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
            <h1 className="font-display text-[34px] font-semibold leading-normal tracking-[-0.6px] text-[#1f2a26]">
              Welcome back
            </h1>
            <p className="font-sans text-[15px] leading-normal text-[#5b655e]">
              Sign in to your AetherPeople workspace.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <AuthGoogleButton label="Continue with Google" />

            <div className="my-1 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ece9e2]" />
              <span className="font-sans text-xs text-[#a7ada6]">
                or sign in with email
              </span>
              <div className="h-px flex-1 bg-[#ece9e2]" />
            </div>

            <AuthInput
              label="Work email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
            />

            <div className="flex w-full flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[13px] font-semibold leading-normal text-[#42504a]">
                  Password
                </span>
                <Link
                  href="/login#forgot"
                  className="font-sans text-[13px] font-semibold leading-normal text-[#2f6f61] transition-colors hover:text-[#286253]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="flex h-12 w-full items-center rounded-[11px] border border-[#e3ded4] bg-white px-4 py-0 transition-colors focus-within:border-[#2f6f61]/60 focus-within:ring-2 focus-within:ring-[#2f6f6133]">
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="h-full w-full bg-transparent font-sans text-sm tracking-[3px] text-[#1f2a26] outline-none placeholder:tracking-normal placeholder:text-[#a7ada6]"
                />
              </div>
            </div>

            <Link
              href="/"
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-[11px] bg-[#2f6f61] font-sans text-[15px] font-semibold text-white shadow-[0px_10px_24px_rgba(47,111,97,0.28)] transition-colors hover:bg-[#286253]"
            >
              Sign in
              <ArrowRight className="size-[17px]" strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-1.5">
            <span className="font-sans text-sm text-[#8a948d]">
              New to AetherPeople?
            </span>
            <Link
              href="/signup"
              className="font-sans text-sm font-semibold text-[#2f6f61] transition-colors hover:text-[#286253]"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
