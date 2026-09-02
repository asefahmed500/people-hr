import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { rateLimit, isLoginLocked, recordLoginFailure, recordLoginSuccess } from "@/lib/rate-limit"

const DUMMY_HASH = "$2a$10$0000000000000000000000000000000000000000000000000000000"

// Check whether a credentials login needs a 2FA code.
// Returns 401 for bad credentials, or { twoFactorRequired } for valid ones.
export async function POST(request: Request) {
  const limited = rateLimit(request, { name: "2fa-required", limit: 30, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body?.password === "string" ? body.password : ""

  // Account lockout check — same as authorize()
  if (isLoginLocked(email)) {
    // Timing equalizer: run bcrypt against a dummy hash so attackers can't
    // distinguish "locked" from "wrong password" by response time.
    await bcrypt.compare(password, DUMMY_HASH)
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again later." },
      { status: 429 },
    )
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password || user.deactivatedAt) {
    // Timing equalizer: run bcrypt even for missing users to prevent
    // account-enumeration via response-time differences.
    await bcrypt.compare(password, DUMMY_HASH)
    recordLoginFailure(email)
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    recordLoginFailure(email)
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  recordLoginSuccess(email)
  return NextResponse.json({ twoFactorRequired: user.twoFactorEnabled === true })
}
