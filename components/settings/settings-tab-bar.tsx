"use client"

import { cn } from "@/lib/utils"

const tabs = [
  { label: "Profile", key: "profile" },
  { label: "Notifications", key: "notifications" },
  { label: "Security", key: "security" },
  { label: "Billing", key: "billing" },
  { label: "Team", key: "team" },
]

export function SettingsTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  return (
    <div className="flex h-fit gap-1 border-b border-b-[#e8ebe6]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "mx-0 mb-[-1px] mt-0 flex items-center px-3.5 py-2.5",
            activeTab === tab.key && "border-b-2 border-b-[#2f6f61]",
          )}
        >
          <span
            className={cn(
              "font-sans inline-block text-[13.5px] leading-normal",
              activeTab === tab.key
                ? "font-semibold text-[#2f6f61]"
                : "font-medium text-[#5b655e]",
            )}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
