"use client"

import * as React from "react"
import { CreditCard, Download, Receipt, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { apiRequest } from "@/lib/api-client"
import { exportToCsv } from "@/lib/export"
import { notify } from "@/lib/toast"

type BillingState = {
  configured: boolean
  plan: { name: string; price: string; seatsUsed: number; seatsTotal: number }
  paymentMethod: string | null
  invoices: { id: string; date: string; amount: string; status: string }[]
  portalUrl: string | null
}

export function BillingCard() {
  const [state, setState] = React.useState<BillingState | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    let active = true
    apiRequest<BillingState>("/api/billing")
      .then((d) => {
        if (active) setState(d)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [attempt])

  const retry = () => {
    setFailed(false)
    setAttempt((a) => a + 1)
  }

  const handleDownload = (inv: { id: string; date: string; amount: string; status: string }) => {
    exportToCsv("invoice", [inv], [
      { key: "id", label: "Invoice" },
      { key: "date", label: "Date" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status" },
    ])
    notify.success("Invoice downloaded", `${inv.id} exported as CSV.`)
  }

  if (!state) {
    if (failed) {
      return (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4">
          <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
            Billing & invoices
          </span>
          <p className="font-sans text-[12.5px] leading-normal text-muted-foreground">
            Couldn’t load your billing details.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
          Billing & invoices
        </span>
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
        Billing & invoices
      </span>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card">
          <CreditCard className="size-[16px] text-secondary-foreground" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
            {state.plan.name} plan · {state.plan.price}
          </span>
          <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
            {state.configured && state.paymentMethod
              ? state.paymentMethod
              : state.configured
                ? "Payment method connected"
                : "Payments aren’t connected yet"}
          </span>
        </div>
        {state.configured && state.portalUrl ? (
          <Button asChild variant="outline" size="sm">
            <a href={state.portalUrl}>Manage</a>
          </Button>
        ) : null}
      </div>

      {!state.configured ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border bg-muted p-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-secondary-foreground" strokeWidth={2} />
          <p className="font-sans text-[12px] leading-normal text-muted-foreground">
            Billing isn’t live yet. Add <span className="font-mono text-secondary-foreground">STRIPE_SECRET_KEY</span>{" "}
            to your environment and a Stripe customer id to enable payments and invoices.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="font-sans text-[13px] font-semibold leading-normal text-foreground">
          Recent invoices
        </span>
        {state.invoices.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted px-4 py-4 text-center font-sans text-[12px] text-muted-foreground">
            No invoices yet.
          </p>
        ) : (
          state.invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card">
                <Receipt className="size-[14px] text-secondary-foreground" strokeWidth={2} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-sans text-[12.5px] font-medium leading-normal text-foreground">
                  {inv.id}
                </span>
                <span className="font-sans text-[11px] leading-normal text-muted-foreground">
                  {inv.date} · {inv.amount}
                </span>
              </div>
              <Badge variant="secondary" className="h-5 bg-foreground/10 text-[10px] font-semibold text-secondary-foreground">
                {inv.status}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Download ${inv.id}`}
                      onClick={() => handleDownload(inv)}
                    >
                      <Download className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download invoice</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
