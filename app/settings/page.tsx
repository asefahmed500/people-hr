import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SettingsPageClient } from "./settings-page-client"

export default function SettingsPage() {
  return (
    <DashboardShell activeHref="/settings" current="Settings" accentCurrent>
      <SettingsPageClient />
    </DashboardShell>
  )
}
