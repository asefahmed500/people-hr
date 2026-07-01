import { Bell, ChevronRight, Command, Search } from "lucide-react"

import { cn } from "@/lib/utils"

type TopBarProps = {
  current: string
  accentCurrent?: boolean
}

export function TopBar({ current, accentCurrent = false }: TopBarProps) {
  return (
    <div className="flex h-12 w-full shrink-0 items-center gap-4">
      <Breadcrumb current={current} accentCurrent={accentCurrent} />
      <CommandSearch />
      <TopActions />
    </div>
  )
}

function Breadcrumb({
  current,
  accentCurrent,
}: {
  current: string
  accentCurrent: boolean
}) {
  return (
    <nav className="flex shrink-0 items-center gap-2">
      <span className="font-sans text-[13px] leading-normal text-[#8a948d]">
        Workspace
      </span>
      <ChevronRight className="size-3.5 text-[#c3c8c0]" strokeWidth={2} />
      <span
        className={cn(
          "font-sans text-[13px] font-semibold leading-normal",
          accentCurrent ? "text-[#2f6f61]" : "text-[#1f2a26]",
        )}
      >
        {current}
      </span>
    </nav>
  )
}

function CommandSearch() {
  return (
    <div className="flex h-10 max-w-[420px] flex-1 items-center gap-2.5 rounded-xl border border-[#ece9e2] bg-white px-3.5">
      <Search className="size-4 shrink-0 text-[#b0b7af]" strokeWidth={2} />
      <span className="flex-1 font-sans text-[13px] leading-normal text-[#a6aca3]">
        Search people, teams, documents…
      </span>
      <span className="flex shrink-0 items-center gap-[3px] rounded-[7px] border border-[#ece9e2] bg-[#f3f1ec] px-[7px] py-[3px]">
        <Command className="size-3 text-[#8a948d]" strokeWidth={2} />
        <span className="font-sans text-[11px] font-semibold leading-normal text-[#8a948d]">
          K
        </span>
      </span>
    </div>
  )
}

function TopActions() {
  return (
    <div className="ml-auto mr-0 my-0 flex shrink-0 items-center gap-3">
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex size-10 items-center justify-center rounded-xl border border-[#ece9e2] bg-white"
      >
        <Bell className="size-[18px] text-[#5b655e]" strokeWidth={2} />
        <span className="absolute right-2.5 top-[9px] size-[7px] rounded-full border-2 border-white bg-[#e76f51]" />
      </button>
    </div>
  )
}
