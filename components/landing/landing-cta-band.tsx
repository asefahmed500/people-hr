import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function LandingCtaBand() {
  return (
    <section className="mx-5 mb-20 sm:mx-10 lg:mx-20">
      <div className="flex w-full flex-col items-center gap-6 rounded-[28px] border border-border bg-muted p-10 text-center sm:p-16">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-3.5">
          <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[40px]">
            Ready to give your team a workspace they love?
          </h2>
          <p className="font-sans text-base text-secondary-foreground">
            Start your free 14-day trial today. Bring your whole team in
            minutes.
          </p>
        </div>
        <div className="flex w-fit flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex h-[52px] items-center gap-2 rounded-xl bg-primary px-7 font-sans text-[15px] font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
          >
            Start free trial
            <ArrowRight className="size-[17px]" strokeWidth={2} />
          </Link>
          <Link
            href="mailto:sales@northwind.co?subject=PeopleHR%20demo"
            className="flex h-[52px] items-center rounded-xl border border-border bg-card px-6 font-sans text-[15px] font-medium text-secondary-foreground transition-colors hover:bg-muted"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  )
}
