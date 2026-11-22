import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { recordActivity } from "@/lib/activity"

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
  await recordActivity({
    actor: {
      id: session.user.id!,
      name: session.user.name ?? null,
      department: (session.user as { department?: string | null }).department ?? null,
      role: session.user.role,
    },
    action: "deleted",
    module: "security",
    summary: "Deactivated own account",
  })
  return NextResponse.json({ ok: true })
}
