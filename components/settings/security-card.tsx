"use client"

import * as React from "react"
import { History, Key, Loader2, LogOut, Shield } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import type { SignInEvent } from "@/lib/data/settings"

type SecurityCardProps = {
  twoFactorEnabled: boolean
  signInEvents: SignInEvent[]
  currentSignInId: string | null
  onSignOutEverywhere: () => void | Promise<void>
  revoking?: boolean
  sessionsLoading?: boolean
  sessionsError?: string | null
  onRetrySessions?: () => void
  onChangePassword: () => void
  onEnableTwoFactor: () => void
  onDisableTwoFactor: () => void
}

function formatWhen(at: string): string {
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return at
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function SecurityCard({
  twoFactorEnabled,
  signInEvents,
  currentSignInId,
  onSignOutEverywhere,
  revoking = false,
  sessionsLoading = false,
  sessionsError = null,
  onRetrySessions,
  onChangePassword,
  onEnableTwoFactor,
  onDisableTwoFactor,
}: SecurityCardProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
        Security
      </span>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card">
          <Key className="size-[16px] text-secondary-foreground" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
            Password
          </span>
          <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
            Change your password to keep your account secure.
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onChangePassword}>
          Change
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card">
          <Shield className="size-[16px] text-secondary-foreground" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
            Two-factor authentication
          </span>
          <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
            {twoFactorEnabled ? "Authenticator app configured" : "Not configured"}
          </span>
        </div>
        <Switch
          aria-label="Two-factor authentication"
          checked={twoFactorEnabled}
          onCheckedChange={(v) => (v ? onEnableTwoFactor() : onDisableTwoFactor())}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card">
            <History className="size-[16px] text-secondary-foreground" strokeWidth={2} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
              Sign-in activity
            </span>
            <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
              Your {signInEvents.length} most recent successful sign-ins.
            </span>
          </div>
        </div>

        {sessionsError ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <span className="font-sans text-[11px] leading-normal text-muted-foreground">
              Couldn’t load activity. {sessionsError}
            </span>
            <Button type="button" variant="outline" size="xs" onClick={onRetrySessions}>
              Retry
            </Button>
          </div>
        ) : sessionsLoading ? (
          <p className="font-sans text-[11.5px] leading-normal text-muted-foreground">
            Loading sign-in activity…
          </p>
        ) : signInEvents.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {signInEvents.map((event) => {
              const current = currentSignInId !== null && event.id === currentSignInId
              return (
                <li key={event.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="font-sans text-[11.5px] font-medium leading-normal text-foreground">
                    {formatWhen(event.at)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[11px] leading-normal text-muted-foreground">
                    {event.userAgent}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] leading-normal text-muted-foreground">
                    {event.ip}
                  </span>
                  {current ? (
                    <Badge variant="secondary" className="h-5 shrink-0 rounded-md bg-primary/10 text-[10px] font-medium text-primary">
                      Current
                    </Badge>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="font-sans text-[11.5px] leading-normal text-muted-foreground">
            No sign-ins recorded yet. Successful sign-ins will appear here.
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={revoking}
          >
            {revoking ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-3.5" strokeWidth={2} aria-hidden="true" />
            )}
            {revoking ? "Signing out…" : "Sign out everywhere"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Sign out everywhere?"
        description="This ends every active session for your account, including this one. You'll need to sign in again."
        confirmLabel="Sign out everywhere"
        destructive
        submitting={revoking}
        onConfirm={() => {
          setConfirmOpen(false)
          void onSignOutEverywhere()
        }}
      />
    </div>
  )
}
