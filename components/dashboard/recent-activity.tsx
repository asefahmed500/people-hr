"use client"

import * as React from "react"
import Link from "next/link"

import { ActivityEmptyState, ActivityItem } from "@/components/activity/activity-item"
import { Skeleton } from "@/components/ui/skeleton"
import { apiRequest } from "@/lib/api-client"
import type { ActivityEvent } from "@/lib/data-types-activity"

type ActivityResponse = { events: ActivityEvent[]; total: number }

/** Compact dashboard card showing the five most recent workspace events. */
export function RecentActivity() {
  const [events, setEvents] = React.useState<ActivityEvent[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const controller = new AbortController()
    apiRequest<ActivityResponse>("/api/activity?limit=5", { signal: controller.signal })
      .then((response) => {
        setEvents(Array.isArray(response.events) ? response.events : [])
      })
      .catch(() => {
        // A widget shouldn't break the dashboard â€” render the empty state.
        setEvents([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-3.5 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
          Recent activity
        </h2>
        <Link
          href="/activity"
          className="font-sans inline-block shrink-0 text-xs font-semibold leading-normal text-primary hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-xl bg-muted" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-3/5 bg-muted" />
                <Skeleton className="h-3 w-1/3 bg-muted" />
              </div>
            </div>
          ))
        ) : events.length === 0 ? (
          <ActivityEmptyState compact />
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li key={event.id}>
                <ActivityItem event={event} compact />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
