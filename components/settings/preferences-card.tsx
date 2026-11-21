"use client"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import type { Preferences } from "@/lib/data"

const prefMeta: Partial<Record<keyof Preferences, { label: string; desc: string }>> = {
  emailDigest: {
    label: "Email digest",
    desc: "Receive a daily summary of workspace activity",
  },
  desktopNotifications: {
    label: "Desktop notifications",
    desc: "Show browser notifications for mentions and tasks",
  },
  weeklyReport: {
    label: "Weekly report",
    desc: "Receive a weekly summary every Monday morning",
  },
}

export function PreferencesCard({
  preferences,
  onToggle,
}: {
  preferences: Preferences
  onToggle: (key: string) => void
}) {
  const entries = (Object.entries(prefMeta) as [
    keyof Preferences,
    { label: string; desc: string },
  ][]).filter(([, meta]) => !!meta)

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      <h2 className="mx-0 mb-4 mt-0 font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
        Preferences
      </h2>
      {entries.map(([key, meta], idx) => (
        <div
          key={key}
          className={cn(
            "flex h-fit items-center justify-between px-0 py-3",
            idx !== entries.length - 1 && "border-b border-b-border",
          )}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-sans inline-block text-[13.5px] font-medium leading-normal text-foreground">
              {meta.label}
            </span>
            <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
              {meta.desc}
            </span>
          </div>
          <Switch
            aria-label={meta.label}
            checked={preferences[key]}
            onCheckedChange={() => onToggle(key)}
          />
        </div>
      ))}
    </div>
  )
}
