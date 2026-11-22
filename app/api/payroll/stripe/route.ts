import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/auth-guards"

// Read-only Stripe lookup for employee compensation records. This stores a
// customer *reference* alongside salary data; it never creates a charge,
// transfer, payout, portal session, or payment method. When no key is
// configured it degrades honestly instead of inventing a connected account.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const key = process.env.STRIPE_SECRET_KEY
  const customerId = request.nextUrl.searchParams.get("customerId")?.trim() ?? ""
  if (!key) {
    return NextResponse.json({
      configured: false,
      customer: null,
      message: "Stripe is not connected. Add STRIPE_SECRET_KEY to verify customer references.",
    })
  }
  if (!customerId) {
    return NextResponse.json({ configured: true, customer: null })
  }
  // Reference ids come from an admin form. Keep the call bounded to Stripe's
  // id shape so arbitrary URLs can't be built from user input.
  if (!/^cus_[A-Za-z0-9_]{1,255}$/.test(customerId)) {
    return NextResponse.json({ configured: true, customer: null, error: "Invalid customer id." }, { status: 400 })
  }

  try {
    const headers = { Authorization: `Bearer ${key}` }
    const [customerResponse, methodsResponse] = await Promise.all([
      fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      }),
      fetch(
        `https://api.stripe.com/v1/payment_methods?customer=${encodeURIComponent(customerId)}&type=card&limit=1`,
        { headers, signal: AbortSignal.timeout(10_000) },
      ),
    ])

    if (!customerResponse.ok) {
      return NextResponse.json({
        configured: true,
        customer: null,
        error: customerResponse.status === 404 ? "Customer not found in Stripe." : "Stripe request failed.",
      })
    }

    const customer = (await customerResponse.json()) as {
      id: string
      email?: string | null
      name?: string | null
    }
    const methods = methodsResponse.ok
      ? ((await methodsResponse.json()) as { data?: Array<{ card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number } }> })
      : { data: [] }
    const card = methods.data?.[0]?.card

    return NextResponse.json({
      configured: true,
      customer: {
        id: customer.id,
        email: customer.email ?? null,
        name: customer.name ?? null,
        cardBrand: card?.brand ?? null,
        cardLast4: card?.last4 ?? null,
      },
    })
  } catch {
    return NextResponse.json({
      configured: true,
      customer: null,
      error: "Could not reach Stripe. The stored reference is unchanged.",
    })
  }
}
