import { Star } from "lucide-react"

export function LandingTestimonial() {
  return (
    <section
      id="customers"
      className="flex w-full flex-col items-center gap-7 px-5 pb-[72px] pt-0 text-center sm:px-10 lg:px-20"
    >
      <div className="flex w-full max-w-[820px] flex-col items-center gap-[18px]">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="size-[18px] fill-primary text-primary"
              strokeWidth={2}
            />
          ))}
        </div>
        <blockquote className="text-h2">
          &ldquo;We replaced four tools with PeopleHR and our team actually
          thanks us for it. Onboarding went from a two-week scramble to a warm,
          guided first day.&rdquo;
        </blockquote>
      </div>
      <div className="flex w-fit items-center gap-3">
        <div className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-foreground">
          <span className="font-sans text-[15px] font-semibold leading-normal text-background">
            MR
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
            Maya Reinhardt
          </span>
          <span className="font-sans text-[13px] leading-normal text-muted-foreground">
            Head of People, Northwind Labs
          </span>
        </div>
      </div>
    </section>
  )
}
