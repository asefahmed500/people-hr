"use client"

import * as React from "react"
import { Bell, BellDot, CheckCheck, Inbox } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { notify } from "@/lib/toast"
import type { Notification } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type NotificationDropdownProps = {
  items: Notification[]
  unreadCount: number
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

export function NotificationDropdown({
  items,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const handleClick = (n: Notification) => {
    if (!n.read) onMarkRead(n.id)
    setOpen(false)
    if (n.href) {
      router.push(n.href)
    } else {
      notify.info(n.title, n.description)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className={cn(
            "relative flex size-10 items-center justify-center rounded-xl border transition-colors",
            open
              ? "border-[#2f6f61] bg-[#edf6f3]"
              : "border-[#ece9e2] bg-white hover:border-[#d4d9d2]",
          )}
        >
          {unreadCount > 0 ? (
            <>
              <BellDot className="size-[18px] text-[#2f6f61]" strokeWidth={2} />
              <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-[#e76f51] px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="size-[18px] text-[#5b655e]" strokeWidth={2} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[380px] rounded-[14px] border border-[#ece9e2] bg-white p-0 shadow-[0_4px_24px_rgba(31,42,38,0.08)]"
      >
        <div className="flex items-center justify-between border-b border-b-[#edeae3] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[15px] font-semibold leading-normal text-[#1f2a26]">
              Notifications
            </span>
            {unreadCount > 0 ? (
              <span className="flex items-center justify-center rounded-full bg-[#e76f51] px-2 py-0.5 text-[10px] font-bold leading-none text-white">
                {unreadCount}
              </span>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                onMarkAllRead()
                notify.info("All notifications marked as read")
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[#2f6f61] transition-colors hover:bg-[#2f6f610d]"
            >
              <CheckCheck className="size-3.5" strokeWidth={2} />
              <span className="font-sans text-[11.5px] font-medium leading-normal">
                Mark all read
              </span>
            </button>
          ) : null}
        </div>
        <div className="flex max-h-[400px] flex-col overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10">
              <Inbox className="size-8 text-[#c3c8c0]" strokeWidth={1.5} />
              <span className="font-sans text-[13px] font-medium leading-normal text-[#8a948d]">
                No notifications yet
              </span>
              <span className="font-sans text-[11.5px] leading-normal text-[#b0b7af]">
                Actions across the dashboard will appear here.
              </span>
            </div>
          ) : (
            items.map((n, idx) => (
              <React.Fragment key={n.id}>
                {idx > 0 ? null : null}
                <DropdownMenuItem
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1.5 border-b border-b-[#f2efe9] px-5 py-3.5 transition-colors focus:bg-[#faf9f6]",
                    !n.read && "bg-[#f6fcf9]",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.read ? (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#2f6f61]" />
                    ) : (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-transparent" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-sans text-[13px] leading-normal",
                            n.read
                              ? "font-medium text-[#1f2a26]"
                              : "font-semibold text-[#1f2a26]",
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="ml-auto shrink-0 whitespace-nowrap font-sans text-[10.5px] leading-normal text-[#b0b7af]">
                          {n.timestamp}
                        </span>
                      </div>
                      <span className="font-sans text-[12px] leading-normal text-[#6b7770]">
                        {n.description}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </React.Fragment>
            ))
          )}
        </div>
        {items.length > 0 ? (
          <div className="border-t border-t-[#edeae3] px-5 py-2.5 text-center">
            <span className="font-sans text-[11px] leading-normal text-[#b0b7af]">
              Click a notification to navigate
            </span>
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
