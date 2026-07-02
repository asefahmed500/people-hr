import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function LandingCtaBand() {
  return (
    <section className="mx-5 mb-20 sm:mx-10 lg:mx-20">
      <div className="flex w-full flex-col items-center gap-6 rounded-[28px] border border-[#ece9e2] bg-[#f6f4ef] p-10 text-center sm:p-16">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-3.5">
          <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.6px] text-[#1f2a26] sm:text-[40px]">
            Ready to give your team a workspace they love?
          </h2>
          <p className="font-sans text-base text-[#5b655e]">
            Start your free 14-day trial today. Bring your whole team in
            minutes.
          </p>
        </div>
        <div className="flex w-fit flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex h-[52px] items-center gap-2 rounded-[13px] bg-[#2f6f61] px-7 font-sans text-[15px] font-semibold text-white shadow-[0px_10px_24px_rgba(47,111,97,0.28)] transition-colors hover:bg-[#286253]"
          >
            Start free trial
            <ArrowRight className="size-[17px]" strokeWidth={2} />
          </Link>
          <Link
            href="/login"
            className="flex h-[52px] items-center rounded-[13px] border border-[#e3ded4] bg-white px-6 font-sans text-[15px] font-semibold text-[#42504a] transition-colors hover:bg-[#f6f4ef]"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  )
}
