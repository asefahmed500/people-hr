import Link from "next/link"
import { ArrowRight, Check, Play } from "lucide-react"

export function LandingHero() {
  return (
    <section className="flex w-full flex-col items-center gap-8 px-5 pb-14 pt-[72px] text-center sm:px-10 lg:px-20">
      <div className="flex w-full max-w-[720px] flex-col items-center gap-[22px]">
        <div className="flex w-fit items-center gap-2 rounded-full border border-[#2f6f6133] bg-[#2f6f611a] px-3.5 py-1.5">
          <span className="size-[7px] shrink-0 rounded-full bg-[#2f6f61]" />
          <span className="font-sans text-xs font-semibold uppercase tracking-[1.44px] text-[#2f6f61]">
            The modern HR platform
          </span>
        </div>

        <h1 className="flex flex-wrap justify-center gap-x-[15px] font-display text-[44px] font-semibold leading-[1.04] tracking-[-1.6px] text-[#1f2a26] sm:text-[58px]">
          <span>People ops that</span>
          <span className="bg-clip-text bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(100,_182,_172)_100%)] text-transparent">
            runs itself.
          </span>
        </h1>

        <p className="max-w-[520px] font-sans text-[15px] leading-[1.6] text-[#5b655e] sm:text-[17px]">
          Onboarding, attendance, leave, payroll and performance in one calm
          workspace. Automations do the busywork so your team can focus on
          people.
        </p>

        <div className="mt-1 flex flex-col items-center gap-3.5">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex h-[52px] items-center gap-2 rounded-[13px] bg-[#2f6f61] px-[26px] font-sans text-[15px] font-semibold text-white shadow-[0px_10px_24px_rgba(47,111,97,0.28)] transition-colors hover:bg-[#286253]"
            >
              Start free trial
              <ArrowRight className="size-[17px]" strokeWidth={2} />
            </Link>
            <Link
              href="/login"
              className="flex h-[52px] items-center gap-[9px] rounded-[13px] border border-[#e3ded4] bg-white px-[22px] font-sans text-[15px] font-semibold text-[#42504a] shadow-[0px_2px_8px_rgba(47,111,97,0.05)] transition-colors hover:bg-[#f6f4ef]"
            >
              <Play className="size-[18px] text-[#2f6f61]" strokeWidth={2} />
              See live demo
            </Link>
          </div>
          <div className="flex items-center gap-[7px]">
            <Check className="size-[15px] text-[#2f6f61]" strokeWidth={2} />
            <span className="font-sans text-[13px] leading-normal text-[#8a948d]">
              Free for 14 days · No credit card required
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
