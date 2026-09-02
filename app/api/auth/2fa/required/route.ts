import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"

// Check whether a credentials login needs a 2FA code.
// Returns 401 for bad credentials, or { twoFactorRequired } for valid ones.
export async function POST(request: Request) {
  const limited = rateLimit(request, { name: "2fa-required", limit: 30, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body?.password === "string" ? body.password : ""

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password || user.deactivatedAt) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  return NextResponse.json({ twoFactorRequired: user.twoFactorEnabled === true })
}
