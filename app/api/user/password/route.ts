import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { bumpSessionEpoch } from "@/lib/login-history"
import { recordActivity } from "@/lib/activity"

// Change the signed-in user's password (verifies the current one).
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const limited = rateLimit(request, {
    name: "change-password",
    limit: 5,
    windowMs: 15 * 60_000,
    subject: session.user.id,
  })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const current = typeof body?.current === "string" ? body.current : ""
  const next = typeof body?.next === "string" ? body.next : ""

  if (!current || next.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 })
  }
  if (next.length > 128) {
    return NextResponse.json({ error: "New password must be at most 128 characters." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.password) {
    return NextResponse.json({ error: "This account has no password set." }, { status: 400 })
  }

  const valid = await bcrypt.compare(current, user.password)
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 })
  }

  const hash = await bcrypt.hash(next, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } })
  // Other sessions must not survive a password change.
  await bumpSessionEpoch(user.id).catch(() => {})
  await recordActivity({
    actor: {
      id: user.id,
      name: user.name ?? null,
      department: user.department ?? null,
      role: user.role,
    },
    action: "updated",
    module: "security",
    summary: "Changed account password",
  })
  return NextResponse.json({ ok: true })
}
