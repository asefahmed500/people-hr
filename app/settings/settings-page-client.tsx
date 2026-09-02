"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { type SettingsStore, defaultSettingsStore } from "@/lib/data"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { apiRequest } from "@/lib/api-client"
import { notify } from "@/lib/toast"
import { Skeleton } from "@/components/ui/skeleton"
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
import { ChangePasswordDialog } from "@/components/settings/change-password-dialog"
import {
  TwoFactorSetupDialog,
  TwoFactorDisableDialog,
} from "@/components/settings/two-factor-setup"

const VALID_TABS = ["profile", "notifications", "security", "billing", "team"]
const BASE_TABS = ["profile", "notifications", "security"]

export function SettingsPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout, user } = useAuth()
  const isAdmin = user?.role === "admin"
  // Billing + team are admin-only surfaces; mirror the server's role guards.
  const allowedTabs = isAdmin ? VALID_TABS : BASE_TABS
  const { state: settings, setState: setSettings, hydrated } = useApiStore<SettingsStore>(
    "/api/store/settings",
    () => defaultSettingsStore,
  )
  const [activeTab, setActiveTab] = React.useState(() => {
    const requested = searchParams.get("tab") ?? ""
    return allowedTabs.includes(requested) ? requested : "profile"
  })
  const snapshotRef = React.useRef<SettingsStore | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [pwOpen, setPwOpen] = React.useState(false)
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = React.useState(false)
  const [twoFactorDisableOpen, setTwoFactorDisableOpen] = React.useState(false)
  const [deactivating, setDeactivating] = React.useState(false)

  // Keep snapshot + dirty state in sync.
  React.useEffect(() => {
    if (!hydrated) return
    if (snapshotRef.current === null) {
      snapshotRef.current = settings
      return
    }
    setDirty(JSON.stringify(snapshotRef.current) !== JSON.stringify(settings))
  }, [settings, hydrated])

  // Deep-linkable tab via ?tab=… (admin-only tabs fall back to profile).
  const updateTab = (tab: string) => {
    if (!allowedTabs.includes(tab)) return
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", tab)
    window.history.replaceState(null, "", url.toString())
  }

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

  const handleSave = async () => {
    const name = settings.personal.fullName.trim()
    const email = settings.personal.email.trim()
    if (name.length < 2) {
      notify.error("Enter your full name", "Your name must be at least 2 characters.")
      return
    }
    if (!/.+@.+\..+/.test(email)) {
      notify.error("Enter a valid email", "Check your work email address.")
      return
    }
    setSaving(true)
    try {
      // Department is admin-managed (it drives data scoping); non-admins never
      // send it so the save can't fail on a field they can't edit.
      const res = await apiRequest<{ ok: boolean; error?: string }>("/api/user/profile", {
        method: "PATCH",
        body: {
          name,
          email,
          ...(isAdmin ? { department: settings.personal.department } : {}),
          avatar: settings.personal.avatar ?? "",
        },
      })
      if (!res.ok) throw new Error(res.error ?? "Could not save.")
      snapshotRef.current = settings
      setDirty(false)
      notify.success("Settings saved", "Your changes have been saved successfully.")
    } catch (err) {
      notify.error("Couldn’t save", err instanceof Error ? err.message : "Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (snapshotRef.current) setSettings(snapshotRef.current)
    setDirty(false)
    notify.info("Changes discarded", "Reverted to your last saved settings.")
  }

  const handleDeactivate = async () => {
    if (deactivating) return
    setDeactivating(true)
    try {
      await apiRequest("/api/user/deactivate", { method: "POST" })
    } catch (err) {
      notify.error(
        "Couldn’t deactivate",
        err instanceof Error ? err.message : "Please try again.",
      )
      setDeactivating(false)
      return
    }
    await logout()
    notify.success("Account deactivated", "You've been signed out.")
    router.replace("/login")
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
          <>
            <SecurityCard
              twoFactorEnabled={user?.twoFactorEnabled ?? settings.preferences.twoFactor}
              onChangePassword={() => setPwOpen(true)}
              onEnableTwoFactor={() => setTwoFactorSetupOpen(true)}
              onDisableTwoFactor={() => setTwoFactorDisableOpen(true)}
            />
            <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
            <TwoFactorSetupDialog
              open={twoFactorSetupOpen}
              onOpenChange={setTwoFactorSetupOpen}
              onEnabled={() =>
                setSettings((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, twoFactor: true },
                }))
              }
            />
            <TwoFactorDisableDialog
              open={twoFactorDisableOpen}
              onOpenChange={setTwoFactorDisableOpen}
              onDisabled={() =>
                setSettings((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, twoFactor: false },
                }))
              }
            />
          </>
        )
      case "billing":
        if (!isAdmin) return null
        return <BillingCard />
      case "team":
        if (user?.role !== "admin") {
          return (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-10 text-center">
              <span className="font-sans text-sm font-semibold text-foreground">
                Team management is admin-only
              </span>
              <span className="font-sans text-[12.5px] text-muted-foreground">
                Ask an administrator to invite or manage team members.
              </span>
            </div>
          )
        }
        return <TeamMembersCard />
      case "profile":
      default:
        return (
          <>
            <PersonalInformationCard
              personal={settings.personal}
              onChange={handlePersonalChange}
              canEditDepartment={isAdmin}
            />
            <PreferencesCard
              preferences={settings.preferences}
              onToggle={handleToggle}
            />
            <DangerZoneCard onDeactivate={handleDeactivate} submitting={deactivating} />
            <FormActions
              onSave={handleSave}
              onCancel={handleCancel}
              saving={saving}
              disabled={!dirty}
            />
          </>
        )
    }
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <>
      <SettingsHeader />
      <SettingsTabBar activeTab={activeTab} onTabChange={updateTab} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4">
          {renderTabContent()}
        </div>
        <SettingsRightPanel />
      </div>
    </>
  )
}
