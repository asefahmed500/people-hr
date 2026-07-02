"use client"

import { Key, History, Shield } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { notify } from "@/lib/toast"

type SecurityCardProps = {
  twoFactorEnabled: boolean
  onToggleTwoFactor: () => void
}

export function SecurityCard({ twoFactorEnabled, onToggleTwoFactor }: SecurityCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#e8ebe6] bg-white p-5">
      <span className="font-sans text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Security
      </span>

      <div className="flex items-center gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f6f4ef]">
          <Key className="size-[16px] text-[#5b655e]" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-sans text-[13px] font-medium leading-normal text-[#1f2a26]">
            Password
          </span>
          <span className="font-sans text-[11.5px] leading-normal text-[#8a948d]">
            Last changed 3 months ago
          </span>
        </div>
        <button
          type="button"
          onClick={() => notify.info("Password change coming soon")}
          className="rounded-lg border border-[#e8ebe6] bg-white px-3 py-1.5 font-sans text-[12px] font-medium text-[#2f6f61]"
        >
          Change
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f6f4ef]">
          <Shield className="size-[16px] text-[#5b655e]" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-sans text-[13px] font-medium leading-normal text-[#1f2a26]">
            Two-factor authentication
          </span>
          <span className="font-sans text-[11.5px] leading-normal text-[#8a948d]">
            {twoFactorEnabled ? "Authenticator app configured" : "Not configured"}
          </span>
        </div>
        <Switch
          checked={twoFactorEnabled}
          onCheckedChange={onToggleTwoFactor}
        />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f6f4ef]">
          <History className="size-[16px] text-[#5b655e]" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-sans text-[13px] font-medium leading-normal text-[#1f2a26]">
            Login history
          </span>
          <span className="font-sans text-[11.5px] leading-normal text-[#8a948d]">
            8 active sessions across 3 devices
          </span>
        </div>
        <button
          type="button"
          onClick={() => notify.info("Login history coming soon")}
          className="rounded-lg border border-[#e8ebe6] bg-white px-3 py-1.5 font-sans text-[12px] font-medium text-[#2f6f61]"
        >
          Review
        </button>
      </div>
    </div>
  )
}
