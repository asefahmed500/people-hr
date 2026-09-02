"use client"

import * as React from "react"
import { CreditCard, Download, Receipt, ShieldAlert } from "lucide-react"

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
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5">
          <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
            Billing & invoices
          </span>
          <p className="font-sans text-[12.5px] leading-normal text-muted-foreground">
            Couldn’t load your billing details.
          </p>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg border border-border bg-card px-3 py-1.5 font-sans text-[12px] font-medium text-primary"
          >
            Try again
          </button>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
          Billing & invoices
        </span>
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
        Billing & invoices
      </span>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
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
          <a
            href={state.portalUrl}
            className="rounded-lg border border-border bg-card px-3 py-1.5 font-sans text-[12px] font-medium text-primary"
          >
            Manage
          </a>
        ) : null}
      </div>

      {!state.configured ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-border bg-muted p-3.5">
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
          <p className="rounded-xl border border-dashed border-border bg-muted px-4 py-5 text-center font-sans text-[12px] text-muted-foreground">
            No invoices yet.
          </p>
        ) : (
          state.invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
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
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-sans text-[10px] font-semibold text-secondary-foreground">
                {inv.status}
              </span>
              <button
                type="button"
                aria-label={`Download ${inv.id}`}
                onClick={() => handleDownload(inv)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <Download className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
