"use client"

import * as React from "react"
import { Bell, ChevronRight, Command, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { STORAGE_KEYS, defaultNotificationsStore, type NotificationsStore } from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

type TopBarProps = {
  current: string
  accentCurrent?: boolean
  onOpenCommand?: () => void
}

export function TopBar({ current, accentCurrent = false, onOpenCommand }: TopBarProps) {
  const { state: notifStore, setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )

  const unreadCount = notifStore.items.filter((n) => !n.read).length

  const handleMarkRead = (id: string) => {
    setNotifs((prev) => ({
      ...prev,
      items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  }

  const handleMarkAllRead = () => {
    setNotifs((prev) => ({
      ...prev,
      items: prev.items.map((n) => ({ ...n, read: true })),
    }))
  }

  return (
    <div className="flex h-12 w-full shrink-0 items-center gap-4 pl-12 lg:pl-0">
      <Breadcrumb current={current} accentCurrent={accentCurrent} />
      <CommandSearch onOpen={onOpenCommand} />
      <div className="ml-auto mr-0 my-0 flex shrink-0 items-center gap-3">
        <NotificationDropdown
          items={notifStore.items}
          unreadCount={unreadCount}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      </div>
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

function CommandSearch({ onOpen }: { onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-10 max-w-[420px] flex-1 items-center gap-2.5 rounded-xl border border-[#ece9e2] bg-white px-3.5 text-left"
    >
      <Search className="size-4 shrink-0 text-[#b0b7af]" strokeWidth={2} />
      <span className="flex-1 font-sans text-[13px] leading-normal text-[#a6aca3]">
        <span className="hidden sm:inline">Search people, teams, documents…</span>
        <span className="sm:hidden">Search…</span>
      </span>
      <span className="hidden shrink-0 items-center gap-[3px] rounded-[7px] border border-[#ece9e2] bg-[#f3f1ec] px-[7px] py-[3px] sm:flex">
        <Command className="size-3 text-[#8a948d]" strokeWidth={2} />
        <span className="font-sans text-[11px] font-semibold leading-normal text-[#8a948d]">
          K
        </span>
      </span>
    </button>
  )
}
