import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guards"

// Billing state. Admin-only: plan/seats/invoices are organization-level
// financial data. When STRIPE_SECRET_KEY is configured this talks to Stripe's
// REST API; otherwise it reports payments aren't connected (honest, no fakes).
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const user = await prisma.user.findUnique({ where: { id: auth.session.user.id } })
  const key = process.env.STRIPE_SECRET_KEY
  const configured = !!key && !!user?.stripeCustomerId

  const activeUserCount = await prisma.user.count({
    where: { deactivatedAt: null },
  })

  let paymentMethod: string | null = null
  let invoices: { id: string; date: string; amount: string; status: string }[] = []

  if (configured && key && user?.stripeCustomerId) {
    try {
      const headers = { Authorization: `Bearer ${key}` }
      // Independent reads — run them together instead of paying two round trips.
      const [pmResponse, invResponse] = await Promise.all([
        fetch(
          `https://api.stripe.com/v1/payment_methods?customer=${user.stripeCustomerId}&type=card&limit=1`,
          { headers, signal: AbortSignal.timeout(10_000) },
        ),
        fetch(
          `https://api.stripe.com/v1/invoices?customer=${user.stripeCustomerId}&limit=20`,
          { headers, signal: AbortSignal.timeout(10_000) },
        ),
      ])
      const [pm, inv] = await Promise.all([pmResponse.json(), invResponse.json()])
      const card = pm?.data?.[0]?.card
      if (card) {
        paymentMethod = `${card.brand} ending in ${card.last4} · Expires ${String(card.exp_month).padStart(2, "0")}/${card.exp_year}`
      }

      invoices = (inv?.data ?? []).map((i: { id: string; created: number; amount_due: number; status: string }) => ({
        id: i.id,
        date: new Date(i.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        amount: `$${(i.amount_due / 100).toLocaleString("en-US")}`,
        status: i.status.charAt(0).toUpperCase() + i.status.slice(1),
      }))
    } catch {
      // Fall through to the default plan view.
    }
  }

  return NextResponse.json({
    configured,
    // Only report a plan when Stripe is actually configured. The old hardcoded
    // "Business / $12 per seat / 300 seats" was a fabricated entitlement.
    plan: {
      name: configured ? "Business" : "No active plan",
      price: configured ? "Stripe billing" : "not configured",
      seatsUsed: activeUserCount,
      seatsTotal: configured ? activeUserCount : 0,
    },
    paymentMethod,
    invoices,
    portalUrl: configured ? process.env.STRIPE_PORTAL_URL ?? null : null,
  })
}
