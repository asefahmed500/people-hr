import { NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

const notificationSchema = z.object({
  type: z.string().min(1).max(64).default("settings_changed"),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  href: z
    .string()
    .max(500)
    // Browsers normalise backslashes after a leading slash into a
    // protocol-relative URL (/\evil.com -> http://evil.com), so reject those.
    .refine((v) => v.startsWith("/") && !/^\/[\\/]/.test(v), "Use an internal path.")
    .nullable()
    .optional(),
  timestamp: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().slice(0, 10)),
})

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

  const parsed = notificationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification." }, { status: 400 })
  }
  const { type, title, description, href, timestamp } = parsed.data
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
