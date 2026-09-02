"use client"

import { Key, History, Shield } from "lucide-react"
import { Switch } from "@/components/ui/switch"

type SecurityCardProps = {
  twoFactorEnabled: boolean
  onChangePassword: () => void
  onEnableTwoFactor: () => void
  onDisableTwoFactor: () => void
}

export function SecurityCard({
  twoFactorEnabled,
  onChangePassword,
  onEnableTwoFactor,
  onDisableTwoFactor,
}: SecurityCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
        Security
      </span>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
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
        <button
          type="button"
          onClick={onChangePassword}
          className="rounded-lg border border-border bg-card px-3 py-1.5 font-sans text-[12px] font-medium text-primary"
        >
          Change
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
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

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <History className="size-[16px] text-secondary-foreground" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
            Login history
          </span>
          <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
            Sessions are managed through your browser.
          </span>
        </div>
      </div>
    </div>
  )
}
