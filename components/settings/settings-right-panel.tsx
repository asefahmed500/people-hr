"use client"

import Link from "next/link"
import { BotMessageSquare, Check, ChevronRight, HelpCircle } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { useApiStore } from "@/hooks/use-api-store"

const planFeatures = [
  "Unlimited employees",
  "Advanced analytics & reports",
  "Priority support & SLA",
]

export function SettingsRightPanel() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const role = user?.role ?? "—"
  const email = user?.email ?? "—"
  // Real workspace name from the organization document (admin-set).
  const organization = useApiStore<{ companyName?: string }>(
    "/api/store/organization",
    () => ({ companyName: "", departments: [], offices: [], orgChart: [] }),
  )
  const workspace = organization.state.companyName?.trim()

  const summary = [
    { label: "Account", value: email },
    { label: "Role", value: role },
    { label: "Workspace", value: workspace || "Not set" },
  ]

  return (
    <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[320px]">
      {isAdmin ? (
        <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-fit items-center justify-between">
            <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
              Your plan
            </span>
            <span className="flex items-center rounded-full border border-border bg-muted px-2 py-[3px]">
              <span className="font-sans text-[11px] font-semibold leading-normal text-primary">
                Business
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {planFeatures.map((feature) => (
              <div key={feature} className="flex h-fit items-center gap-2">
                <Check className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
                <span className="font-sans inline-block text-[12.5px] leading-normal text-secondary-foreground">
                  {feature}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/settings?tab=billing"
            className="flex items-center justify-center rounded-lg border border-border bg-card px-3.5 py-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="font-sans text-[13px] font-medium leading-normal text-primary">
              Manage plan
            </span>
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
          Account summary
        </span>
        <div className="flex flex-col gap-2.5">
          {summary.map((row) => (
            <div key={row.label} className="flex h-fit items-center justify-between gap-3">
              <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
                {row.label}
              </span>
              <span className="truncate font-sans inline-block text-[12.5px] font-medium leading-normal text-foreground">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex h-fit items-center gap-2">
          <HelpCircle className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={2} />
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
            Need help?
          </span>
        </div>
        <Link
          href="/assistant"
          className="flex h-fit items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <BotMessageSquare className="size-3.5 text-primary" strokeWidth={2} />
          <span className="font-sans text-[12.5px] font-medium leading-normal text-primary">
            Ask the AI assistant
          </span>
          <ChevronRight className="size-3 text-primary" strokeWidth={2} />
        </Link>
        <a
          href="mailto:support@northwind.co"
          className="flex h-fit items-center gap-1.5"
        >
          <span className="font-sans text-[12.5px] leading-normal text-secondary-foreground">
            Contact support
          </span>
          <ChevronRight className="size-3 text-secondary-foreground" strokeWidth={2} />
        </a>
      </div>
    </div>
  )
}
