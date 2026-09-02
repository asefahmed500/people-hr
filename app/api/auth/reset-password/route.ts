import { NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex")
}

// Complete a password reset with a valid token.
export async function POST(request: Request) {
  const limited = rateLimit(request, { name: "reset-password", limit: 10, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const raw = typeof body?.token === "string" ? body.token : ""
  const password = typeof body?.password === "string" ? body.password : ""

  if (raw.length < 20 || password.length < 8) {
    return NextResponse.json({ error: "Invalid reset link or password." }, { status: 400 })
  }

  const token = sha256(raw)
  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.findUnique({ where: { email: record.identifier } })
  if (!user || user.deactivatedAt) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.json({ error: "This account is no longer active." }, { status: 400 })
  }
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } })
  await prisma.verificationToken.delete({ where: { token } })

  return NextResponse.json({ ok: true })
}
