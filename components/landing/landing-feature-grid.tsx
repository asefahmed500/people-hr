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
        <p className="font-sans text-xs font-semibold uppercase tracking-[1.68px] text-[#2f6f61]">
          Why teams switch
        </p>
        <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.8px] text-[#1f2a26] sm:text-[42px]">
          Less admin, more people
        </h2>
        <p className="font-sans text-base leading-[1.6] text-[#5b655e]">
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
              className="flex flex-1 flex-col gap-4 rounded-[18px] border border-[#ece9e2] bg-white p-7 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]"
            >
              <div className="flex size-[46px] items-center justify-center rounded-[13px] bg-[#2f6f611a]">
                <Icon className="size-[22px] text-[#2f6f61]" strokeWidth={2} />
              </div>
              <h3 className="font-display text-xl font-semibold leading-normal text-[#1f2a26]">
                {feature.title}
              </h3>
              <p className="font-sans text-sm leading-[1.6] text-[#5b655e]">
                {feature.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
