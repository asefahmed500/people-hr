import Link from "next/link"
import { PanelLeftClose, PanelLeftOpen, Users, UserRound } from "lucide-react"

import { navItems } from "./nav-data"
import { UserCard } from "./user-card"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

type DashboardSidebarProps = {
  activeHref?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function DashboardSidebar({
  activeHref = "/",
  collapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const { user } = useAuth()
  const role = user?.role ?? "employee"
  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(role))

  if (collapsed) {
    return (
      <aside className="flex w-[68px] shrink-0 flex-col items-center gap-4 border-r border-border bg-card px-2 py-[22px]">
        <button
          type="button"
          aria-label="Expand sidebar"
          title="Expand sidebar"
          onClick={onToggleCollapse}
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PanelLeftOpen className="size-[18px]" strokeWidth={2} />
        </button>
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-foreground shadow-card">
          <Users className="size-[18px] text-background" strokeWidth={2} />
        </div>
        <nav className="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = item.href === activeHref
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg transition-colors",
                  active
                    ? "bg-foreground/10 text-primary"
                    : "text-secondary-foreground hover:bg-muted",
                )}
              >
                <Icon
                  className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")}
                  strokeWidth={2}
                />
              </Link>
            )
          })}
        </nav>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
          <UserRound className="size-4 text-primary" strokeWidth={2} />
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex w-[248px] shrink-0 flex-col gap-5 border-r border-border bg-card px-4 py-[22px]">
      <BrandMark onCollapse={onToggleCollapse} />
      <nav className="mx-0 mb-0 mt-1.5 flex w-full flex-1 flex-col gap-0.5 overflow-y-auto">
        <p className="pb-1.5 pl-2.5 pr-2.5 pt-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          Workspace
        </p>
        <ul className="flex w-full flex-col gap-0.5">
          {visibleItems.map((item) => (
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

function BrandMark({ onCollapse }: { onCollapse?: () => void }) {
  return (
    <div className="flex h-12 w-full shrink-0 items-center gap-[11px] px-2 py-0">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-foreground shadow-card">
        <Users className="size-[18px] text-background" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-h4">
          PeopleHR
        </span>
      </div>
      <button
        type="button"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
        onClick={onCollapse}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <PanelLeftClose className="size-[18px]" strokeWidth={2} />
      </button>
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-[11px] rounded-lg px-2.5 py-2 transition-colors",
        active
          ? "bg-foreground/10 text-primary"
          : "text-secondary-foreground hover:bg-muted",
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active ? "text-primary" : "text-muted-foreground",
        )}
        strokeWidth={2}
      />
      <span
        className={cn(
          "font-sans text-[13.5px] leading-normal",
          active ? "font-semibold text-primary" : "font-medium",
        )}
      >
        {item.label}
      </span>
      {item.badge ? (
        <span
          className={cn(
            "ml-auto mr-0 my-0 inline-block rounded-full px-1.5 py-0.5 font-sans leading-normal",
            item.badge.tone === "accent"
              ? "bg-foreground/10 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-secondary-foreground"
              : "text-[11px] font-semibold text-muted-foreground",
          )}
        >
          {item.badge.text}
        </span>
      ) : null}
    </Link>
  )
}
