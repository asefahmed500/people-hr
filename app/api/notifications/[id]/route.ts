import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  // Only allow updating `read` on the caller's own notification.
  const existing = await prisma.notification.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: {
      read: typeof body.read === "boolean" ? body.read : existing.read,
    },
  })
  return NextResponse.json({
    id: updated.id,
    type: updated.type,
    title: updated.title,
    description: updated.description,
    timestamp: updated.timestamp,
    read: updated.read,
    href: updated.href ?? undefined,
  })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const existing = await prisma.notification.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await prisma.notification.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
