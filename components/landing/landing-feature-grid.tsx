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
    desc: "Approvals, onboarding and reminders route themselves by your policies â€” no chasing.",
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
      <div className="flex w-full max-w-[700px] flex-col items-center gap-3.5 text-center">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Why teams switch
        </p>
        <h2 className="joi-statement">Less admin, more people</h2>
        <p className="font-sans text-sm leading-[1.6] text-muted-foreground sm:text-[15px]">
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
              className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-5"
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Icon className="size-5 text-foreground" strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="text-h3 font-semibold">
                {feature.title}
              </h3>
              <p className="font-sans text-sm leading-[1.6] text-muted-foreground">
                {feature.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
