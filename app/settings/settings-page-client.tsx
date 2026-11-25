"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { signOut } from "next-auth/react"

import { type SettingsStore, defaultSettingsStore } from "@/lib/data"
import type { SessionsResponse, SignInEvent } from "@/lib/data/settings"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { useSession } from "next-auth/react"
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
  const searchParams = useSearchParams()
  const { logout, user } = useAuth()
  const { update } = useSession()
  const isAdmin = user?.role === "admin"
  // Billing + team are admin-only surfaces; mirror the server's role guards.
  const allowedTabs = React.useMemo(() => isAdmin ? VALID_TABS : BASE_TABS, [isAdmin])
  const { state: settings, setState: setSettings, hydrated } = useApiStore<SettingsStore>(
    "/api/store/settings",
    // A reset must never stamp demo placeholders over a real account. Seed
    // from the signed-in identity, with schema-valid fallbacks for OAuth
    // accounts that have no name/department.
    () => ({
      ...defaultSettingsStore,
      personal: {
        ...defaultSettingsStore.personal,
        fullName: user?.name ?? defaultSettingsStore.personal.fullName,
        email: user?.email || defaultSettingsStore.personal.email,
        department: user?.department ?? defaultSettingsStore.personal.department,
      },
    }),
  )
  const [activeTab, setActiveTab] = React.useState(() => {
    const requested = searchParams.get("tab") ?? ""
    return allowedTabs.includes(requested) ? requested : "profile"
  })
  // Deep links from inside Settings (e.g. "Open billing") change only the URL;
  // sync the visible tab so the control actually works on the same route.
  React.useEffect(() => {
    const requested = searchParams.get("tab") ?? ""
    if (requested && allowedTabs.includes(requested)) {
      void Promise.resolve().then(() => setActiveTab(requested))
    }
  }, [searchParams, allowedTabs])
  const snapshotRef = React.useRef<SettingsStore | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [pwOpen, setPwOpen] = React.useState(false)
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = React.useState(false)
  const [twoFactorDisableOpen, setTwoFactorDisableOpen] = React.useState(false)
  const [deactivating, setDeactivating] = React.useState(false)
  const [signInEvents, setSignInEvents] = React.useState<SignInEvent[]>([])
  const [currentSignInId, setCurrentSignInId] = React.useState<string | null>(null)
  const [sessionsLoading, setSessionsLoading] = React.useState(true)
  const [sessionsError, setSessionsError] = React.useState<string | null>(null)
  const [sessionsNonce, setSessionsNonce] = React.useState(0)
  const [revoking, setRevoking] = React.useState(false)

  const loadSessions = React.useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await apiRequest<SessionsResponse>("/api/sessions")
      setSignInEvents(res.events)
      setCurrentSignInId(res.currentSignInId)
      setSessionsError(null)
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : "Please try again.")
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  // Fetch on mount and refresh whenever the Security tab is (re)opened.
  React.useEffect(() => {
    // Defer the fetch (and its synchronous loading-state update) out of the
    // effect body to avoid cascading renders on mount.
    void Promise.resolve().then(() => loadSessions())
  }, [loadSessions, activeTab, sessionsNonce])

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
          // Job title lives in the settings document, not on User. Send it
          // explicitly so a concurrent debounced store PUT can't drop it.
          jobTitle: settings.personal.jobTitle.trim(),
          ...(isAdmin ? { department: settings.personal.department } : {}),
          avatar: settings.personal.avatar ?? "",
        },
      })
      if (!res.ok) throw new Error(res.error ?? "Could not save.")
      // Refresh the JWT so the top bar and greeting show the new identity
      // immediately instead of the cached session name.
      await update()
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
  }

  const handleSignOutEverywhere = async () => {
    if (revoking) return
    setRevoking(true)
    try {
      await apiRequest<{ ok: boolean; epoch: number }>("/api/sessions", { method: "DELETE" })
      // Refresh the list before tearing down this session's client state.
      await loadSessions()
      await signOut({ callbackUrl: "/login" })
    } catch (err) {
      notify.error(
        "Couldn’t sign out everywhere",
        err instanceof Error ? err.message : "Please try again.",
      )
      setRevoking(false)
    }
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
              signInEvents={signInEvents}
              currentSignInId={currentSignInId}
              onSignOutEverywhere={handleSignOutEverywhere}
              revoking={revoking}
              sessionsLoading={sessionsLoading}
              sessionsError={sessionsError}
              onRetrySessions={() => setSessionsNonce((n) => n + 1)}
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
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted p-8 text-center">
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
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <>
      <SettingsHeader />
      <SettingsTabBar activeTab={activeTab} onTabChange={updateTab} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4">
          {renderTabContent()}
        </div>
        <SettingsRightPanel />
      </div>
    </>
  )
}
