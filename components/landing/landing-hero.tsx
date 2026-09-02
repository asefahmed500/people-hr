import Link from "next/link"
import { ArrowRight, Check, Play } from "lucide-react"

export function LandingHero() {
  return (
    <section className="flex w-full flex-col items-center gap-8 px-5 pb-14 pt-[72px] text-center sm:px-10 lg:px-20">
      <div className="flex w-full max-w-[720px] flex-col items-center gap-[22px]">
        <div className="flex w-fit items-center gap-2 rounded-full border border-foreground/20 bg-foreground/10 px-3.5 py-1.5">
          <span className="size-[7px] shrink-0 rounded-full bg-primary" />
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.09em] text-primary">
            The modern HR platform
          </span>
        </div>

        <h1 className="flex flex-wrap justify-center gap-x-[15px] text-[44px] font-semibold leading-[1.04] tracking-[-0.02em] text-foreground sm:text-[58px]">
          <span>People ops that</span>
          <span className="bg-clip-text bg-foreground text-transparent">
            runs itself.
          </span>
        </h1>

        <p className="max-w-[520px] font-sans text-[15px] leading-[1.6] text-secondary-foreground sm:text-[17px]">
          Onboarding, attendance, leave, payroll and performance in one calm
          workspace. Automations do the busywork so your team can focus on
          people.
        </p>

        <div className="mt-1 flex flex-col items-center gap-3.5">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex h-[52px] items-center gap-2 rounded-xl bg-primary px-[26px] font-sans text-[15px] font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
            >
              Start free trial
              <ArrowRight className="size-[17px]" strokeWidth={2} />
            </Link>
            <Link
              href="/login?callbackUrl=%2Fdashboard"
              className="flex h-[52px] items-center gap-[9px] rounded-xl border border-border bg-card px-[22px] font-sans text-[15px] font-medium text-secondary-foreground shadow-card transition-colors hover:bg-muted"
            >
              <Play className="size-[18px] text-primary" strokeWidth={2} />
              Explore the demo
            </Link>
          </div>
          <div className="flex items-center gap-[7px]">
            <Check className="size-[15px] text-primary" strokeWidth={2} />
            <span className="font-sans text-[13px] leading-normal text-muted-foreground">
              Free for 14 days · No credit card required
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
