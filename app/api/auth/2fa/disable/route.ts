import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { recordActivity } from "@/lib/activity"

// Disable 2FA after verifying the account password.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const password = typeof body?.password === "string" ? body.password : ""

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.password) {
    return NextResponse.json({ error: "This account has no password." }, { status: 400 })
  }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, totpSecret: null },
    }),
    prisma.backupCode.deleteMany({ where: { userId: user.id } }),
  ])

  await recordActivity({
    actor: { id: user.id, name: user.name ?? null, department: user.department ?? null, role: user.role },
    action: "updated",
    module: "security",
    summary: "Disabled two-factor authentication",
  })
  return NextResponse.json({ ok: true })
}
