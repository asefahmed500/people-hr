import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth-guards"
import type { SessionsResponse } from "@/lib/data/settings"
import { bumpSessionEpoch, getLoginHistory } from "@/lib/login-history"

/** Self-only sign-in activity for the Security settings card. */
export async function GET() {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  const doc = await getLoginHistory(guard.session.user.id)
  const body: SessionsResponse = {
    events: doc.events,
    currentSignInId: guard.session.user.signInId ?? null,
    signOutEverywhereSupported: true,
  }
  return NextResponse.json(body)
}

/**
 * Revoke every previously issued JWT for this user by bumping the stored
 * session epoch. The jwt callback detects the mismatch at the next refresh
 * (on the next request) and drops those tokens. The caller then signs out its
 * own session explicitly.
 */
export async function DELETE() {
  const guard = await requireAuth()
  if (!guard.ok) return guard.response

  try {
    const epoch = await bumpSessionEpoch(guard.session.user.id)
    return NextResponse.json({ ok: true, epoch })
  } catch {
    return NextResponse.json(
      { error: "Could not revoke sessions. Please try again." },
      { status: 500 },
    )
  }
}
