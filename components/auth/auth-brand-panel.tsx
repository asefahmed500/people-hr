import Link from "next/link"
import { Sparkles, Users } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
    <div className="relative flex w-full shrink-0 flex-col justify-between overflow-clip bg-muted px-8 py-10 sm:px-14 sm:py-12 lg:w-[600px]">
      <Link
        href="/"
        className="relative flex w-fit items-center gap-[11px]"
      >
        <div className="flex size-[38px] shrink-0 items-center justify-center rounded-md bg-foreground">
          <Users className="size-5 text-background" strokeWidth={2} aria-hidden="true" />
        </div>
        <span className="text-h3 font-semibold text-foreground">
          PeopleHR
        </span>
      </Link>

      <div className="relative flex w-full flex-col gap-7">
        <Sparkles className="size-9 text-foreground" strokeWidth={1.5} aria-hidden="true" />
        <p className="max-w-[520px] text-[20px] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground sm:text-[24px]">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="flex w-fit items-center gap-3">
          <Avatar className="size-9 bg-foreground">
            <AvatarFallback className="bg-transparent font-sans text-sm font-semibold text-background">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
              {authorName}
            </span>
            <span className="font-sans text-[13px] leading-normal text-muted-foreground">
              {authorRole}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex w-full items-center gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5">
            <span className="text-h2 font-semibold text-foreground">
              {stat.value}
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
