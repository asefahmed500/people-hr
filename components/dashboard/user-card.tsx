"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, MoreHorizontal, Settings, UserRound } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { notify } from "@/lib/toast"

export function UserCard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [pending, setPending] = React.useState(false)

  const handleLogout = async () => {
    if (pending) return
    setPending(true)
    try {
      await logout()
      notify.success("Signed out", "You’ve been signed out.")
      router.replace("/login")
    } finally {
      setPending(false)
    }
  }

  return (
    <DropdownMenu>
      <div className="flex h-fit w-full shrink-0 items-center gap-2.5 rounded-xl border border-border bg-muted p-2.5">
        <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-foreground/10">
          <UserRound className="size-5 text-primary" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="inline-block overflow-clip font-sans text-[13px] font-semibold leading-normal text-foreground [text-overflow:ellipsis]">
            {user?.name ?? "Guest"}
          </span>
          <span className="inline-block overflow-clip font-sans text-[11px] leading-normal text-muted-foreground [text-overflow:ellipsis]">
            {user?.role ?? "Not signed in"}
          </span>
        </div>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <MoreHorizontal className="size-4" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="end" side="top" className="w-[220px]">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-sans text-[13px] font-semibold text-foreground">
            {user?.name ?? "Guest"}
          </span>
          <span className="font-sans text-[11px] font-normal text-muted-foreground">
            {user?.email ?? "Not signed in"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 font-sans text-[13px] text-foreground">
            <Settings className="size-4 text-muted-foreground" strokeWidth={2} />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            handleLogout()
          }}
          disabled={pending}
          className="flex items-center gap-2 font-sans text-[13px] text-foreground focus:text-foreground"
        >
          <LogOut className="size-4 text-muted-foreground" strokeWidth={2} />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
