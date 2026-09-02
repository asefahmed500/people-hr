import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { verifyTotp } from "@/lib/totp"

// Verify a TOTP code and enable 2FA for the user.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const token = typeof body?.token === "string" ? body.token : ""

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.totpSecret) {
    return NextResponse.json({ error: "Start 2FA setup first." }, { status: 400 })
  }

  if (!verifyTotp(token, user.totpSecret)) {
    return NextResponse.json({ error: "That code didn’t match. Try again." }, { status: 400 })
  }

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
  return NextResponse.json({ ok: true })
}
