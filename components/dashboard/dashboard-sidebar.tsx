import Link from "next/link"
import { Ellipsis, Sparkles, UserRound } from "lucide-react"

import { navItems } from "./nav-data"
import { cn } from "@/lib/utils"

export function DashboardSidebar({ activeHref = "/" }: { activeHref?: string }) {
  return (
    <aside className="flex w-[248px] shrink-0 flex-col gap-5 border-r border-[#ece9e2] bg-white px-4 py-[22px]">
      <BrandMark />
      <nav className="mx-0 mb-0 mt-1.5 flex w-full flex-1 flex-col gap-0.5">
        <p className="pb-1.5 pl-2.5 pr-2.5 pt-1 font-sans text-[10.5px] font-semibold uppercase tracking-[1.47px] text-[#b0b7af]">
          Workspace
        </p>
        <ul className="flex w-full flex-col gap-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={item.href === activeHref} />
            </li>
          ))}
        </ul>
      </nav>
      <UserCard />
    </aside>
  )
}

function BrandMark() {
  return (
    <div className="flex h-12 w-full shrink-0 items-center gap-[11px] px-2 py-0">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(100,_182,_172)_100%)]">
        <Sparkles className="size-[19px] text-white" strokeWidth={2} />
      </div>
      <div className="flex flex-col">
        <span className="font-display inline-block overflow-clip text-[17px] font-semibold leading-[1.1] tracking-[-0.17px] text-[#1f2a26]">
          AetherPeople
        </span>
        <span className="font-sans inline-block text-[11px] leading-[1.2] text-[#8a948d]">
          Northwind Labs
        </span>
      </div>
    </div>
  )
}

function NavLink({
  item,
  active,
}: {
  item: (typeof navItems)[number]
  active: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "flex w-full items-center gap-[11px] rounded-[10px] px-2.5 py-2 transition-colors",
        active
          ? "bg-[#2f6f611a] text-[#2f6f61]"
          : "text-[#5b655e] hover:bg-[#f6f4ef]",
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active ? "text-[#2f6f61]" : "text-[#8a948d]",
        )}
        strokeWidth={2}
      />
      <span
        className={cn(
          "font-sans text-[13.5px] leading-normal",
          active ? "font-semibold text-[#2f6f61]" : "font-medium",
        )}
      >
        {item.label}
      </span>
      {item.badge ? (
        <span
          className={cn(
            "ml-auto mr-0 my-0 inline-block rounded-full px-1.5 py-0.5 font-sans leading-normal",
            item.badge.tone === "accent"
              ? "bg-[#64b6ac1f] text-[9.5px] font-bold uppercase tracking-[0.76px] text-[#64b6ac]"
              : "text-[11px] font-semibold text-[#8a948d]",
          )}
        >
          {item.badge.text}
        </span>
      ) : null}
    </Link>
  )
}

function UserCard() {
  return (
    <div className="flex h-fit w-full shrink-0 items-center gap-2.5 rounded-xl border border-[#ece9e2] bg-[#f6f4ef] p-2.5">
      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#2f6f611f]">
        <UserRound className="size-5 text-[#2f6f61]" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="inline-block overflow-clip font-sans text-[13px] font-semibold leading-normal text-[#1f2a26] [text-overflow:ellipsis]">
          Asef Ahmed
        </span>
        <span className="inline-block overflow-clip font-sans text-[11px] leading-normal text-[#8a948d] [text-overflow:ellipsis]">
          People Operations
        </span>
      </div>
      <Ellipsis className="size-4 shrink-0 text-[#b0b7af]" strokeWidth={2} />
    </div>
  )
}
