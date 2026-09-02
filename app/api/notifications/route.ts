import { NextResponse } from "next/server"
import crypto from "crypto"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

function serialize(n: {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  read: boolean
  href: string | null
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    description: n.description,
    timestamp: n.timestamp,
    read: n.read,
    href: n.href ?? undefined,
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const rows = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    // Long-lived accounts must not be able to grow the bell payload forever.
    take: 200,
  })
  return NextResponse.json(rows.map(serialize))
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 })
  }

  const type = typeof body.type === "string" ? body.type : "settings_changed"
  const title = typeof body.title === "string" ? body.title : ""
  const description = typeof body.description === "string" ? body.description : ""
  const href = typeof body.href === "string" ? body.href : null
  const timestamp =
    typeof body.timestamp === "string" ? body.timestamp : new Date().toISOString().split("T")[0]
  // The id is generated server-side so a client can't collide with an existing row.
  const id = `n-${crypto.randomUUID()}`

  const created = await prisma.notification.create({
    data: {
      id,
      userId: session.user.id,
      type,
      title,
      description,
      timestamp,
      read: false,
      href,
    },
  })
  return NextResponse.json(serialize(created), { status: 201 })
}
