"use client"

import * as React from "react"
import { ChevronRight, Command, LogOut, Moon, Search, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useNotificationsStore } from "@/lib/stores/notifications"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/components/theme-provider"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

type TopBarProps = {
  current: string
  accentCurrent?: boolean
  onOpenCommand?: () => void
}

export function TopBar({ current, accentCurrent = false, onOpenCommand }: TopBarProps) {
  const items = useNotificationsStore((s) => s.items)
  const ensureLoaded = useNotificationsStore((s) => s.ensureLoaded)
  const refreshNotifications = useNotificationsStore((s) => s.refresh)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)

  React.useEffect(() => {
    void ensureLoaded()
    // Notifications are created server-side by approvals, reports and jobs.
    // Poll quietly so the bell reflects them without a full page reload.
    const timer = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        void refreshNotifications()
      }
    }, 30_000)
    return () => clearInterval(timer)
  }, [ensureLoaded, refreshNotifications])

  const unreadCount = items.filter((n) => !n.read).length

  return (
    <div className="flex h-12 w-full shrink-0 items-center gap-2 pl-12 sm:gap-4 lg:pl-0">
      <Breadcrumb current={current} accentCurrent={accentCurrent} />
      <CommandSearch onOpen={onOpenCommand} />
      <div className="ml-auto mr-0 my-0 flex shrink-0 items-center gap-1.5 sm:gap-3">
        <ThemeToggle />
        <NotificationDropdown
          items={items}
          unreadCount={unreadCount}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
        <SignOutButton />
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="size-4" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Moon className="size-4" strokeWidth={2} aria-hidden="true" />
      )}
    </Button>
  )
}

function SignOutButton() {
  const { logout } = useAuth()
  const [pending, setPending] = React.useState(false)
  const handleSignOut = async () => {
    if (pending) return
    setPending(true)
    try {
      await logout()
    } finally {
      setPending(false)
    }
  }
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="Sign out"
      title="Sign out"
      onClick={handleSignOut}
      loading={pending}
      loadingText="Signing out…"
    >
      <LogOut className="size-3.5" strokeWidth={2} aria-hidden="true" />
      Sign out
    </Button>
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
    <nav className="flex min-w-0 shrink items-center gap-2">
      <span className="hidden font-sans text-[13px] leading-normal text-muted-foreground sm:inline">
        Workspace
      </span>
      <ChevronRight className="hidden size-3.5 text-muted-foreground sm:block" strokeWidth={2} aria-hidden="true" />
      <span
        className={cn(
          "truncate font-sans text-[13px] font-semibold leading-normal",
          accentCurrent ? "text-primary" : "text-foreground",
        )}
      >
        {current}
      </span>
    </nav>
  )
}

function CommandSearch({ onOpen }: { onOpen?: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onOpen}
      className="min-w-0 max-w-[420px] flex-1 justify-start gap-2.5 px-2.5 text-left sm:px-3.5"
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
      <span className="flex-1 text-left text-[13px] font-normal text-muted-foreground">
        <span className="hidden sm:inline">Search people, teams, documents…</span>
        <span className="sm:hidden">Search…</span>
      </span>
      <span className="hidden shrink-0 items-center gap-[3px] rounded-md border border-border bg-muted px-[7px] py-[3px] sm:flex">
        <Command className="size-3 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
        <span className="text-[11px] font-semibold text-muted-foreground">K</span>
      </span>
    </Button>
  )
}
