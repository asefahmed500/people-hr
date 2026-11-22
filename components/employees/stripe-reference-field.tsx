"use client"

import * as React from "react"

import { Field } from "@/components/shared/field"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/api-client"
import { notify } from "@/lib/toast"

/** Admin-only Stripe customer reference. Verification is read-only: the route
 *  checks that the id exists and returns display-only card metadata. No card
 *  details are collected here and no money moves. */
export function StripeReferenceField({
  value,
  onChange,
  onVerified,
}: {
  value: string
  onChange: (value: string) => void
  onVerified: (details: { cardBrand?: string; cardLast4?: string }) => void
}) {
  const [verifying, setVerifying] = React.useState(false)
  const [verified, setVerified] = React.useState<string | null>(null)

  const verify = async () => {
    const id = value.trim()
    if (!id) {
      notify.error("Enter a Stripe customer id first")
      return
    }
    setVerifying(true)
    try {
      const result = await apiRequest<{
        configured: boolean
        customer: { id: string; email?: string | null; cardBrand?: string | null; cardLast4?: string | null } | null
        message?: string
        error?: string
      }>(`/api/payroll/stripe?customerId=${encodeURIComponent(id)}`)
      if (!result.configured) {
        notify.error("Stripe is not connected", result.message)
        return
      }
      if (!result.customer) {
        notify.error("Reference not found", result.error)
        return
      }
      const details = {
        cardBrand: result.customer.cardBrand ?? undefined,
        cardLast4: result.customer.cardLast4 ?? undefined,
      }
      onVerified(details)
      setVerified(
        details.cardLast4
          ? `${details.cardBrand ?? "Card"} ending ${details.cardLast4}`
          : result.customer.email ?? result.customer.id,
      )
      notify.success("Stripe reference verified", "Card details are stored for display only.")
    } catch (error) {
      notify.error("Verification failed", error instanceof Error ? error.message : "Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field
            label="Stripe customer reference"
            value={value}
            onChange={(next) => {
              onChange(next)
              setVerified(null)
            }}
            placeholder="cus_... (reference only, no payment)"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={verify}
          loading={verifying}
          loadingText="Checking…"
          className="min-w-[104px]"
        >
          Verify
        </Button>
      </div>
      {verified ? (
        <p className="text-[11px] text-muted-foreground">Verified: {verified}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Stored for payroll records only. This app never charges or pays out.
        </p>
      )}
    </div>
  )
}
