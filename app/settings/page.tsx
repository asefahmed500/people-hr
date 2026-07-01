import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SettingsHeader } from "@/components/settings/settings-header"
import { SettingsTabBar } from "@/components/settings/settings-tab-bar"
import { PersonalInformationCard } from "@/components/settings/personal-information-card"
import { PreferencesCard } from "@/components/settings/preferences-card"
import { DangerZoneCard } from "@/components/settings/danger-zone-card"
import { FormActions } from "@/components/settings/form-actions"
import { SettingsRightPanel } from "@/components/settings/settings-right-panel"

export default function SettingsPage() {
  return (
    <DashboardShell activeHref="/settings" current="Settings" accentCurrent>
      <SettingsHeader />
      <SettingsTabBar />
      <div className="flex items-start gap-5">
        <div className="flex flex-1 flex-col gap-4">
          <PersonalInformationCard />
          <PreferencesCard />
          <DangerZoneCard />
          <FormActions />
        </div>
        <SettingsRightPanel />
      </div>
    </DashboardShell>
  )
}
