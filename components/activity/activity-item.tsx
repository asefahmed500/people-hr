"use client"

import {
  CheckCircle2,
  History,
  LogIn,
  PencilLine,
  PlusCircle,
  Settings2,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { moduleLabel, type ActivityAction, type ActivityEvent } from "@/lib/data-types-activity"
import { cn } from "@/lib/utils"

export const ACTION_META: Record<ActivityAction, { icon: LucideIcon; label: string; tone: string }> = {
  created: {
    icon: PlusCircle,
    label: "Created",
    tone: "bg-foreground/10 text-primary",
  },
  updated: {
    icon: PencilLine,
    label: "Updated",
    tone: "bg-muted text-secondary-foreground",
  },
  deleted: {
    icon: Trash2,
    label: "Deleted",
    tone: "bg-foreground text-background",
  },
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    tone: "bg-foreground/10 text-foreground",
  },
  declined: {
    icon: XCircle,
    label: "Declined",
    tone: "bg-foreground/10 text-secondary-foreground",
  },
  auth: {
    icon: LogIn,
    label: "Account",
    tone: "bg-muted text-muted-foreground",
  },
  system: {
    icon: Settings2,
    label: "System",
    tone: "bg-muted text-muted-foreground",
  },
}

export function actorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** Short relative label, computed client-side from the event timestamp. */
export function relativeTime(iso: string): string {
  const date = new Date(iso)
  const ms = date.getTime()
  if (Number.isNaN(ms)) return ""
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (seconds < 45) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ActivityEmptyState({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 text-center",
        compact ? "py-7" : "py-16",
      )}
    >
      <History className="size-7 text-muted-foreground" strokeWidth={1.5} />
      <p className="font-sans text-sm font-medium text-foreground">No activity yet</p>
      <p className="max-w-xs font-sans text-[12.5px] text-muted-foreground">
        Changes you make across PeopleHR will show up here.
      </p>
    </div>
  )
}

/** Inner content of a timeline row — the caller supplies the <li> wrapper. */
export function ActivityItem({ event, compact = false }: { event: ActivityEvent; compact?: boolean }) {
  const meta = ACTION_META[event.action] ?? ACTION_META.system
  const Icon = meta.icon
  const fullDate = new Date(event.at)
  const dateTitle = Number.isNaN(fullDate.getTime())
    ? event.at
    : fullDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })

  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          meta.tone,
        )}
        title={meta.label}
        aria-hidden="true"
      >
        <Icon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-sans text-[13.5px] font-semibold leading-normal text-foreground">
            {event.summary}
          </span>
          <Badge variant="secondary" className="h-5 bg-muted text-[10px] font-medium text-muted-foreground">
            {moduleLabel(event.module)}
          </Badge>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 font-sans text-[11.5px] leading-normal text-muted-foreground">
          <Avatar className="size-[18px]">
            <AvatarFallback className="bg-foreground/10 text-[8px] font-semibold text-primary" aria-hidden="true">
              {actorInitials(event.actorName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{event.actorName}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={event.at} title={dateTitle} className="shrink-0">
            {relativeTime(event.at)}
          </time>
        </div>
        {!compact && event.scope.department ? (
          <span className="font-sans text-[11px] leading-normal text-muted-foreground">
            {event.scope.department}
          </span>
        ) : null}
      </div>
    </div>
  )
}
