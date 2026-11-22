import { NextResponse } from "next/server"
import QRCode from "qrcode"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { generateSecretKey, otpauthUrl, generateBackupCodes, hashBackupCode } from "@/lib/totp"
import { recordActivity } from "@/lib/activity"

// Start 2FA enrollment: generate a secret + backup codes (not yet enabled).
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (user.twoFactorEnabled) {
    // Never rotate an already-active secret — doing so would orphan the codes
    // in the user's authenticator app and their backup codes.
    return NextResponse.json({ error: "Two-factor authentication is already enabled." }, { status: 409 })
  }

  const secret = generateSecretKey()
  const account = user.email ?? user.name ?? user.id
  const otpauth = otpauthUrl(account, secret)
  const qr = await QRCode.toDataURL(otpauth)
  const backupCodes = generateBackupCodes()

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret } }),
    prisma.backupCode.deleteMany({ where: { userId: user.id } }),
    prisma.backupCode.createMany({
      // Persist digests only. The plaintext is returned once, for the user to
      // save in their password manager; it is never written to the database.
      data: backupCodes.map((code) => ({ userId: user.id, code: hashBackupCode(code) })),
    }),
  ])

  await recordActivity({
    actor: { id: user.id, name: user.name ?? null, department: user.department ?? null, role: user.role },
    action: "system",
    module: "security",
    summary: "Started two-factor authentication enrollment",
  })

  return NextResponse.json({
    ok: true,
    secret,
    otpauth,
    qr,
    backupCodes,
  })
}
