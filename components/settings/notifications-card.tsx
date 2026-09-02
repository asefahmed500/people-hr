"use client"

import { Bell, Mail, Megaphone } from "lucide-react"
import { Switch } from "@/components/ui/switch"

type NotifPrefs = {
  emailDigest: boolean
  desktopNotifications: boolean
  weeklyReport: boolean
  twoFactor: boolean
}

type NotificationsCardProps = {
  preferences: NotifPrefs
  onToggle: (key: string) => void
}

const notifItems = [
  { key: "emailDigest", label: "Email digest", desc: "Receive a daily summary of activity", icon: Mail },
  { key: "desktopNotifications", label: "Desktop notifications", desc: "Get notified in real time", icon: Bell },
  { key: "weeklyReport", label: "Weekly report", desc: "Receive a weekly performance summary", icon: Megaphone },
]

export function NotificationsCard({ preferences, onToggle }: NotificationsCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
        Notification preferences
      </span>
      <div className="flex flex-col gap-3">
        {notifItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.key} className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-[16px] text-secondary-foreground" strokeWidth={2} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
                  {item.label}
                </span>
                <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
                  {item.desc}
                </span>
              </div>
              <Switch
                checked={(preferences as Record<string, boolean>)[item.key]}
                onCheckedChange={() => onToggle(item.key)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
