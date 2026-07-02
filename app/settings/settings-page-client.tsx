"use client"

import * as React from "react"

import { STORAGE_KEYS, type SettingsStore, defaultSettingsStore } from "@/lib/data"
import { useMockStore } from "@/hooks/use-mock-store"
import { notify } from "@/lib/toast"
import { SettingsHeader } from "@/components/settings/settings-header"
import { SettingsTabBar } from "@/components/settings/settings-tab-bar"
import { PersonalInformationCard } from "@/components/settings/personal-information-card"
import { PreferencesCard } from "@/components/settings/preferences-card"
import { DangerZoneCard } from "@/components/settings/danger-zone-card"
import { FormActions } from "@/components/settings/form-actions"
import { SettingsRightPanel } from "@/components/settings/settings-right-panel"
import { NotificationsCard } from "@/components/settings/notifications-card"
import { SecurityCard } from "@/components/settings/security-card"
import { BillingCard } from "@/components/settings/billing-card"
import { TeamMembersCard } from "@/components/settings/team-members-card"

export function SettingsPageClient() {
  const { state: settings, setState: setSettings, reset } = useMockStore<SettingsStore>(
    STORAGE_KEYS.settings,
    () => defaultSettingsStore,
  )
  const [activeTab, setActiveTab] = React.useState("profile")

  const handlePersonalChange = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }))
  }

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !(prev.preferences as Record<string, boolean>)[key],
      },
    }))
  }

  const handleSave = () => {
    notify.success("Settings saved", "Your changes have been saved successfully.")
  }

  const handleCancel = () => {
    reset()
    notify.info("Changes discarded", "Settings have been reset to their last saved state.")
  }

  const handleDeactivate = () => {
    notify.info("Account deactivated", "Your account has been deactivated.")
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "notifications":
        return (
          <NotificationsCard
            preferences={settings.preferences}
            onToggle={handleToggle}
          />
        )
      case "security":
        return (
          <SecurityCard
            twoFactorEnabled={settings.preferences.twoFactor}
            onToggleTwoFactor={() => handleToggle("twoFactor")}
          />
        )
      case "billing":
        return <BillingCard />
      case "team":
        return <TeamMembersCard />
      case "profile":
      default:
        return (
          <>
            <PersonalInformationCard
              personal={settings.personal}
              onChange={handlePersonalChange}
            />
            <PreferencesCard
              preferences={settings.preferences}
              onToggle={handleToggle}
            />
            <DangerZoneCard onDeactivate={handleDeactivate} />
            <FormActions onSave={handleSave} onCancel={handleCancel} />
          </>
        )
    }
  }

  return (
    <>
      <SettingsHeader />
      <SettingsTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4">
          {renderTabContent()}
        </div>
        <SettingsRightPanel />
      </div>
    </>
  )
}
