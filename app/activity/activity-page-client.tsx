"use client"

import * as React from "react"
import { AlertCircle, History, Loader2, RotateCw } from "lucide-react"

import {
  ActivityEmptyState,
  ActivityItem,
} from "@/components/activity/activity-item"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest } from "@/lib/api-client"
import {
  ACTIVITY_MODULES,
  moduleLabel,
  type ActivityEvent,
} from "@/lib/data-types-activity"

type ActivityResponse = { events: ActivityEvent[]; total: number }

const LIMIT_OPTIONS = [10, 25, 50, 100, 200] as const

function dayKeyOf(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function dayKey(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? "unknown" : dayKeyOf(date)
}

function dayLabel(key: string): string {
  const today = dayKeyOf(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === today) return "Today"
  if (key === dayKeyOf(yesterday)) return "Yesterday"
  const [year, month, day] = key.split("-").map(Number)
  if (year && month && day) {
    const includeYear = year !== new Date().getFullYear()
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      ...(includeYear ? { year: "numeric" } : {}),
    })
  }
  return key
}

type DayGroup = { key: string; label: string; events: ActivityEvent[] }

function groupByDay(events: ActivityEvent[]): DayGroup[] {
  const groups = new Map<string, ActivityEvent[]>()
  for (const event of events) {
    const key = dayKey(event.at)
    const bucket = groups.get(key)
    if (bucket) bucket.push(event)
    else groups.set(key, [event])
  }
  return Array.from(groups, ([key, items]) => ({ key, label: dayLabel(key), events: items }))
}

export function ActivityPageClient() {
  const [events, setEvents] = React.useState<ActivityEvent[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [moduleFilter, setModuleFilter] = React.useState("")
  const [limit, setLimit] = React.useState<number>(50)
  const [reloadKey, setReloadKey] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()
    // Defer the state updates so they aren't synchronous inside the effect
    // body (React 19 cascading-render lint + better interaction teardown).
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return
      setLoading(true)
      setError(null)
    })

    const params = new URLSearchParams({ limit: String(limit) })
    if (moduleFilter) params.set("module", moduleFilter)

    apiRequest<ActivityResponse>(`/api/activity?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        setEvents(Array.isArray(response.events) ? response.events : [])
        setTotal(typeof response.total === "number" ? response.total : 0)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : "Could not load activity.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [moduleFilter, limit, reloadKey])

  const groups = React.useMemo(() => groupByDay(events), [events])

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">Activity</h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          A timeline of changes across your workspace
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="activity-module" className="font-sans text-[12px] font-medium text-muted-foreground">
            Module
          </label>
          <select
            id="activity-module"
            aria-label="Filter by module"
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 font-sans text-[13px] text-foreground"
          >
            <option value="">All modules</option>
            {ACTIVITY_MODULES.map((module) => (
              <option key={module} value={module}>
                {moduleLabel(module)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-36">
          <label htmlFor="activity-limit" className="font-sans text-[12px] font-medium text-muted-foreground">
            Show
          </label>
          <select
            id="activity-limit"
            aria-label="Number of events to show"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="h-9 w-full rounded-md border border-border bg-background px-3 font-sans text-[13px] text-foreground"
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} events
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Refresh activity"
          title="Refresh"
          disabled={loading}
          className="self-start sm:self-end"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCw className="size-4" strokeWidth={2} aria-hidden="true" />
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg bg-border" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-2/5 bg-border" />
                <Skeleton className="h-3 w-1/4 bg-border" />
              </div>
            </div>
          ))}
        </div>
      ) : error !== null ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted px-4 py-14 text-center">
          <AlertCircle className="size-7 text-destructive" strokeWidth={1.6} aria-hidden="true" />
          <p className="font-sans text-sm font-medium text-foreground">Couldn&apos;t load activity</p>
          <p className="max-w-sm font-sans text-[12.5px] text-muted-foreground">{error}</p>
          <Button
            type="button"
            variant="outline"
            loading={loading}
            loadingText="Retrying…"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      ) : events.length === 0 ? (
        <ActivityEmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="font-sans text-[12px] text-muted-foreground">
            Showing {events.length} of {total} {total === 1 ? "event" : "events"}
          </p>
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <History className="size-3.5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
                <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h2>
              </div>
              <ol className="flex flex-col gap-1">
                {group.events.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <ActivityItem event={event} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
