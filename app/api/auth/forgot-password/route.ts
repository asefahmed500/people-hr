import { NextResponse } from "next/server"
import crypto from "crypto"

import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex")
}

// Issue a password-reset token. Without an email transport configured the
// reset link is returned in the response so the UI can show it — but ONLY
// outside production: in production the link must never travel through an
// unauthenticated HTTP response (that would be a full account-takeover path).
export async function POST(request: Request) {
  const limited = rateLimit(request, { name: "forgot-password", limit: 5, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!/.+@.+\..+/.test(email)) {
    return NextResponse.json({ ok: true })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.deactivatedAt) {
    // Never reveal whether an account exists.
    return NextResponse.json({ ok: true })
  }

  await prisma.verificationToken.deleteMany({ where: { identifier: email } })

  const raw = crypto.randomBytes(32).toString("hex")
  const token = sha256(raw)
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires: new Date(Date.now() + 60 * 60 * 1000) },
  })

  const base = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT ?? "3001"}`
  const resetUrl = `${base}/reset-password?token=${raw}`

  // Dev fallback: without SMTP configured, return the link so the UI can show
  // it. Never in production — there the link would only ever travel by email.
  if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, resetUrl })
  }
  // TODO: send resetUrl via email when SMTP_HOST is configured.
  return NextResponse.json({ ok: true })
}
