import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function LandingCtaBand() {
  return (
    <section className="mx-5 mb-20 sm:mx-10 lg:mx-20">
      <div className="joi-panel flex w-full flex-col items-center gap-6 p-6 text-center sm:p-10">
        <div className="flex w-full max-w-[760px] flex-col items-center gap-3.5">
          <h2 className="joi-statement">
            Ready to give your team a workspace they love?
          </h2>
          <p className="font-sans text-sm leading-normal text-muted-foreground sm:text-[15px]">
            Start your free 14-day trial today. Bring your whole team in
            minutes.
          </p>
        </div>
        <div className="flex w-fit flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">
              Start free trial
              <ArrowRight className="button-arrow size-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="mailto:sales@northwind.co?subject=PeopleHR%20demo">Talk to sales</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
