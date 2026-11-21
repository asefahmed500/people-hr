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
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                className={cn(
                  "relative size-9",
                  open && "border-primary bg-muted",
                )}
              >
                {unreadCount > 0 ? (
                  <>
                    <BellDot className="size-[18px] text-primary" strokeWidth={2} aria-hidden="true" />
                    <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-foreground px-1 text-[10px] font-semibold leading-[18px] text-background">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </>
                ) : (
                  <Bell className="size-[18px] text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(380px,calc(100vw-2rem))] rounded-lg border border-border bg-card p-0"
      >
        <div className="flex items-center justify-between border-b border-b-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
              Notifications
            </span>
            {unreadCount > 0 ? (
              <span className="flex h-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold leading-none text-background">
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
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-primary transition-colors hover:bg-foreground/5"
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
            <div className="flex flex-col items-center gap-2 px-4 py-8">
              <Inbox className="size-8 text-muted-foreground" strokeWidth={1.5} />
              <span className="font-sans text-[13px] font-medium leading-normal text-muted-foreground">
                No notifications yet
              </span>
              <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
                Actions across the dashboard will appear here.
              </span>
            </div>
          ) : (
            items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex cursor-pointer flex-col gap-1.5 border-b border-b-border px-4 py-3 transition-colors focus:bg-muted",
                  !n.read && "bg-muted",
                )}
              >
                  <div className="flex items-start gap-2.5">
                    {!n.read ? (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    ) : (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-transparent" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-sans text-[13px] leading-normal",
                            n.read
                              ? "font-medium text-foreground"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="ml-auto shrink-0 whitespace-nowrap font-sans text-[10.5px] leading-normal text-muted-foreground">
                          {n.timestamp}
                        </span>
                      </div>
                      <span className="font-sans text-[12px] leading-normal text-secondary-foreground">
                        {n.description}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
        </div>
        {items.length > 0 ? (
          <div className="border-t border-t-border px-4 py-2 text-center">
            <span className="font-sans text-[11px] leading-normal text-muted-foreground">
              Click a notification to navigate
            </span>
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
