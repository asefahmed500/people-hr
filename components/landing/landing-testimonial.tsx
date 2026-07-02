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
              className="size-[18px] fill-[#2f6f61] text-[#2f6f61]"
              strokeWidth={2}
            />
          ))}
        </div>
        <blockquote className="font-display text-2xl font-medium leading-[1.35] tracking-[-0.4px] text-[#1f2a26] sm:text-3xl">
          &ldquo;We replaced four tools with AetherPeople and our team actually
          thanks us for it. Onboarding went from a two-week scramble to a warm,
          guided first day.&rdquo;
        </blockquote>
      </div>
      <div className="flex w-fit items-center gap-3">
        <div className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(100,_182,_172)_100%)]">
          <span className="font-sans text-[15px] font-semibold leading-normal text-white">
            MR
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="font-sans text-[15px] font-semibold leading-normal text-[#1f2a26]">
            Maya Reinhardt
          </span>
          <span className="font-sans text-[13px] leading-normal text-[#8a948d]">
            Head of People, Northwind Labs
          </span>
        </div>
      </div>
    </section>
  )
}
