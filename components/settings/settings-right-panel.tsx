"use client"

import Link from "next/link"
import { BotMessageSquare, ChevronRight, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useApiStore } from "@/hooks/use-api-store"

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
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
            Plan &amp; billing
          </span>
          {/* No fabricated plan name or entitlements here: the live billing
              panel is the single source of truth for subscription state. */}
          <p className="font-sans text-[12.5px] leading-normal text-muted-foreground">
            Payments aren’t connected yet. Billing details and invoices are
            available once Stripe is configured.
          </p>
          <Button asChild variant="outline">
            <Link href="/settings?tab=billing">Open billing</Link>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
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

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex h-fit items-center gap-2">
          <HelpCircle className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
            Need help?
          </span>
        </div>
        <Link
          href="/assistant"
          className="flex h-fit items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <BotMessageSquare className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans text-[12.5px] font-medium leading-normal text-primary">
            Ask the AI assistant
          </span>
          <ChevronRight className="size-3 text-primary" strokeWidth={2} aria-hidden="true" />
        </Link>
        <a
          href="mailto:support@northwind.co"
          className="flex h-fit items-center gap-1.5"
        >
          <span className="font-sans text-[12.5px] leading-normal text-secondary-foreground">
            Contact support
          </span>
          <ChevronRight className="size-3 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
