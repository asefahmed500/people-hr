"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { DashboardSidebar } from "./dashboard-sidebar"
import { TopBar } from "./top-bar"
import { CommandPalette } from "./command-palette"
import { cn } from "@/lib/utils"

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
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
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

  return (
    <div className="flex min-h-svh w-full bg-[#f6f4ef]">
      <div className="hidden lg:flex">
        <DashboardSidebar activeHref={activeHref} />
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[260px] border-r border-[#ece9e2] bg-white p-4"
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
          "fixed left-4 top-4 z-30 flex size-10 items-center justify-center rounded-xl border border-[#ece9e2] bg-white shadow-sm",
          "lg:hidden",
        )}
      >
        <Menu className="size-5 text-[#5b655e]" strokeWidth={2} />
      </button>

      <main className="flex min-w-0 flex-1 flex-col gap-4 px-3 py-3 sm:gap-6 sm:px-6 sm:py-5 lg:pl-6">
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
      />
    </div>
  )
}
