"use client"

import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Profile", key: "profile" },
  { label: "Notifications", key: "notifications" },
  { label: "Security", key: "security" },
  // Billing is an admin surface (the /api/billing endpoint enforces this too).
  { label: "Billing", key: "billing", adminOnly: true },
  { label: "Team", key: "team", adminOnly: true },
]

export function SettingsTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <div
      role="tablist"
      aria-label="Settings sections"
      className="flex h-fit gap-1 overflow-x-auto border-b border-b-border"
    >
      {tabs
        .filter((tab) => !tab.adminOnly || isAdmin)
        .map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "mx-0 mb-[-1px] mt-0 flex shrink-0 items-center px-3.5 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-primary",
                active && "border-b-2 border-b-primary",
              )}
            >
              <span
                className={cn(
                  "font-sans inline-block text-[13.5px] leading-normal",
                  active
                    ? "font-semibold text-primary"
                    : "font-medium text-secondary-foreground",
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
    </div>
  )
}
