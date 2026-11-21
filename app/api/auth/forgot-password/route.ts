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

  // Deliver by email when a transport is configured. Uses a plain HTTP API so
  // no mail SDK dependency is needed. RESEND_API_KEY + EMAIL_FROM are optional
  // env vars; without them production reports a real failure instead of the
  // old fake `{ ok: true }` that silently stranded users.
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    const from = process.env.EMAIL_FROM || "PeopleHR <no-reply@peoplehr.local>"
    const safeEmail = email.replace(/[<>&"]/g, "")
    try {
      const sent = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [safeEmail],
          subject: "Reset your PeopleHR password",
          html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in one hour. If you didn't request it, you can ignore this email.</p>`,
        }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!sent.ok) {
        return NextResponse.json(
          { error: "Couldn’t send the reset email. Please try again." },
          { status: 502 },
        )
      }
    } catch {
      return NextResponse.json(
        { error: "Couldn’t send the reset email. Please try again." },
        { status: 502 },
      )
    }
    return NextResponse.json({ ok: true })
  }

  // Dev fallback only: the link is safe to display locally, never in production.
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, resetUrl })
  }
  return NextResponse.json(
    { error: "Password reset email isn’t configured. Contact your administrator." },
    { status: 503 },
  )
}
