"use client"

import { Bell, Mail, MessageSquare, Megaphone } from "lucide-react"
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
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#e8ebe6] bg-white p-5">
      <span className="font-sans text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Notification preferences
      </span>
      <div className="flex flex-col gap-3">
        {notifItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.key} className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f6f4ef]">
                <Icon className="size-[16px] text-[#5b655e]" strokeWidth={2} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-sans text-[13px] font-medium leading-normal text-[#1f2a26]">
                  {item.label}
                </span>
                <span className="font-sans text-[11.5px] leading-normal text-[#8a948d]">
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
