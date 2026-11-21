"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <Tabs value={activeTab} onValueChange={onTabChange} className="gap-0">
      <TabsList
        variant="line"
        aria-label="Settings sections"
        className="h-fit w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border p-0"
      >
        {tabs
          .filter((tab) => !tab.adminOnly || isAdmin)
          .map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className={cn(
                "h-auto shrink-0 rounded-none border-b-2 border-transparent px-3 py-2 text-[13.5px] font-medium text-secondary-foreground",
                "data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none",
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
      </TabsList>
    </Tabs>
  )
}
