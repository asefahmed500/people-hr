import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// Soft-deactivate the signed-in user's account.
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { deactivatedAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
