import Link from "next/link"
import { Star, Users } from "lucide-react"

type AuthBrandPanelProps = {
  quote: string
  authorName: string
  authorRole: string
  authorInitials: string
}

const stats = [
  { value: "2,400+", label: "teams" },
  { value: "98.7%", label: "pay accuracy" },
  { value: "47", label: "countries" },
]

export function AuthBrandPanel({
  quote,
  authorName,
  authorRole,
  authorInitials,
}: AuthBrandPanelProps) {
  return (
    <div className="relative flex w-full shrink-0 flex-col justify-between overflow-clip bg-foreground px-8 py-10 sm:px-14 sm:py-12 lg:w-[600px]">
      <div className="pointer-events-none absolute -right-[160px] -top-[160px] size-[520px] rounded-full bg-background/10 blur-[120px]" />

      <Link
        href="/"
        className="relative z-[10] flex w-fit items-center gap-[11px]"
      >
        <div className="flex size-[38px] shrink-0 items-center justify-center rounded-lg border border-background/20 bg-background/15">
          <Users className="size-5 text-background" strokeWidth={2} />
        </div>
        <span className="text-h3 text-background">
          PeopleHR
        </span>
      </Link>

      <div className="relative z-[10] flex w-full flex-col gap-7">
        <div className="flex w-full flex-col gap-5">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-[18px] fill-background text-background"
                strokeWidth={0}
              />
            ))}
          </div>
          <p className="max-w-[440px] text-h2 text-background">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
        <div className="flex w-fit items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-background/20 bg-background/15">
            <span className="font-sans text-sm font-semibold text-background">
              {authorInitials}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[15px] font-semibold leading-normal text-background">
              {authorName}
            </span>
            <span className="font-sans text-[13px] leading-normal text-background/70">
              {authorRole}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-[10] flex w-full items-center gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5">
            <span className="text-h2 text-background">
              {stat.value}
            </span>
            <span className="font-sans text-xs text-background/70">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
