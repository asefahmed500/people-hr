"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSidebar } from "./dashboard-sidebar"
import { TopBar } from "./top-bar"
import { CommandPalette } from "./command-palette"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

type DashboardShellClientProps = {
  activeHref: string
  current: string
  accentCurrent?: boolean
  children: React.ReactNode
}

export function DashboardShellClient({
  activeHref,
  current,
  accentCurrent = false,
  children,
}: DashboardShellClientProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, hydrated, user } = useAuth()

  React.useEffect(() => {
    try {
      const v = localStorage.getItem("peoplehr:sidebar")
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v === "collapsed") setSidebarCollapsed(true)
    } catch {}
  }, [])

  React.useEffect(() => {
    try {
      localStorage.setItem("peoplehr:sidebar", sidebarCollapsed ? "collapsed" : "expanded")
    } catch {}
  }, [sidebarCollapsed])

  React.useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [hydrated, isAuthenticated, router])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false)
  }, [pathname])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-svh w-full flex-col gap-6 bg-muted p-6 sm:p-10">
        <Skeleton className="h-12 w-full rounded-xl bg-card" />
        <Skeleton className="h-72 w-full rounded-2xl bg-card" />
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl bg-card" />
          <Skeleton className="h-64 rounded-2xl bg-card" />
          <Skeleton className="h-64 rounded-2xl bg-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full bg-muted">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:text-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="hidden lg:flex">
        <DashboardSidebar
          activeHref={activeHref}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[260px] border-r border-border bg-card p-4"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <DashboardSidebar activeHref={activeHref} />
        </SheetContent>
      </Sheet>

      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileNavOpen(true)}
        className={cn(
          "fixed left-4 top-4 z-30 flex size-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm",
          "lg:hidden",
        )}
      >
        <Menu className="size-5 text-secondary-foreground" strokeWidth={2} />
      </button>

      <main id="main" className="flex min-w-0 flex-1 flex-col gap-4 px-3 py-3 sm:gap-6 sm:px-6 sm:py-5 lg:pl-6">
        <TopBar
          current={current}
          accentCurrent={accentCurrent}
          onOpenCommand={() => setCommandOpen(true)}
        />
        {children}
      </main>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNavigate={(href) => {
          setCommandOpen(false)
          router.push(href)
        }}
        role={user?.role ?? ""}
      />
    </div>
  )
}
