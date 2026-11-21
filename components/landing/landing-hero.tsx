import Link from "next/link"
import { ArrowRight, Check, Play, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export function LandingHero() {
  return (
    <section className="flex w-full flex-col items-center gap-8 px-5 pb-14 pt-[72px] text-center sm:px-10 lg:px-20">
      <div className="flex w-full max-w-[900px] flex-col items-center gap-[22px]">
        <Badge
          variant="outline"
          className="h-auto gap-2 rounded-md bg-card px-3.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
        >
          <span className="size-[7px] shrink-0 rounded-full bg-foreground" aria-hidden="true" />
          The modern HR platform
        </Badge>

        <h1 className="joi-display mx-auto max-w-[900px]">
          People ops that{" "}
          <Sparkles
            className="mx-[0.1em] inline-block size-[0.68em] align-[-0.06em] text-foreground"
            strokeWidth={2}
            aria-hidden="true"
          />{" "}
          runs itself.
        </h1>

        <p className="max-w-[520px] font-sans text-sm leading-[1.6] text-muted-foreground sm:text-[15px]">
          Onboarding, attendance, leave, payroll and performance in one calm
          workspace. Automations do the busywork so your team can focus on
          people.
        </p>

        <div className="mt-1 flex flex-col items-center gap-3.5">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start free trial
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Link>
            <Link
              href="/login?callbackUrl=%2Fdashboard"
              className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 font-sans text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Play className="size-4 text-foreground" strokeWidth={2} aria-hidden="true" />
              Explore the demo
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="size-4 text-foreground" strokeWidth={2} aria-hidden="true" />
            <span className="font-sans text-xs leading-normal text-muted-foreground">
              Free for 14 days · No credit card required
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
