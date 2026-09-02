import { PieChart, ShieldCheck, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Feature = {
  icon: LucideIcon
  title: string
  desc: string
}

const features: Feature[] = [
  {
    icon: Zap,
    title: "Automated workflows",
    desc: "Approvals, onboarding and reminders route themselves by your policies — no chasing.",
  },
  {
    icon: PieChart,
    title: "Real-time insights",
    desc: "Live headcount, attendance and payroll dashboards leaders can actually act on.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    desc: "SOC 2, role-based access and data residency baked in, so you can rest easy.",
  },
]

export function LandingFeatureGrid() {
  return (
    <section
      id="product"
      className="flex w-full flex-col items-center gap-11 px-5 py-[92px] sm:px-10 lg:px-20"
    >
      <div className="flex w-full max-w-[620px] flex-col items-center gap-3.5 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[1.68px] text-primary">
          Why teams switch
        </p>
        <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[42px]">
          Less admin, more people
        </h2>
        <p className="font-sans text-base leading-[1.6] text-secondary-foreground">
          Everything you need to run a modern people team, built to feel calm
          instead of chaotic.
        </p>
      </div>

      <div className="flex w-full flex-col gap-6 md:flex-row">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="flex flex-1 flex-col gap-4 rounded-2xl border border-border bg-card p-7 shadow-card"
            >
              <div className="flex size-[46px] items-center justify-center rounded-xl bg-foreground/10">
                <Icon className="size-[22px] text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-h3">
                {feature.title}
              </h3>
              <p className="font-sans text-sm leading-[1.6] text-secondary-foreground">
                {feature.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
