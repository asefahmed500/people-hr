import { Star } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
              className="size-4 fill-foreground text-foreground"
              strokeWidth={2}
              aria-hidden="true"
            />
          ))}
        </div>
        <blockquote className="max-w-[820px] text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-foreground sm:text-[22px]">
          &ldquo;We replaced four tools with PeopleHR and our team actually
          thanks us for it. Onboarding went from a two-week scramble to a warm,
          guided first day.&rdquo;
        </blockquote>
      </div>
      <div className="flex w-fit items-center gap-3">
        <Avatar className="size-[46px] bg-foreground">
          <AvatarFallback className="bg-transparent font-sans text-sm font-semibold leading-normal text-background">
            MR
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start">
          <span className="font-sans text-sm font-semibold leading-normal text-foreground">
            Maya Reinhardt
          </span>
          <span className="font-sans text-xs leading-normal text-muted-foreground">
            Head of People, Northwind Labs
          </span>
        </div>
      </div>
    </section>
  )
}
