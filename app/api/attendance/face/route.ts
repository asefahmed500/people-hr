import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/auth-guards"
import { rateLimit } from "@/lib/rate-limit"

// Face enrollments are stored in the ModuleState table under a dedicated
// scope ("__faceid__", keyed by user id) so the generic store API — which
// serves only known module keys and role-filters everything else — can never
// read or write them. Biometric data is only reachable through these guarded
// routes. Upgrade path: a dedicated FaceEnrollment table.

const FACE_SCOPE = "__faceid__"
// Human library face embeddings (@vladmandic/human, faceres model).
const DESCRIPTOR_LENGTH = 1024

type FaceData = {
  descriptor: number[]
  status: "pending" | "approved" | "rejected"
  enrolledAt: string
  reviewedAt?: string
  reviewedBy?: string
}

function parseDescriptor(input: unknown): number[] | null {
  if (!Array.isArray(input) || input.length !== DESCRIPTOR_LENGTH) return null
  const out: number[] = []
  for (const v of input) {
    if (typeof v !== "number" || !Number.isFinite(v)) return null
    out.push(v)
  }
  return out
}

async function readEnrollment(userId: string): Promise<FaceData | null> {
  const row = await prisma.moduleState.findUnique({
    where: { userId_key: { userId: FACE_SCOPE, key: userId } },
  })
  return (row?.data as FaceData | undefined) ?? null
}

// GET — anyone signed in sees their own enrollment status. Admins may request
// the full list (?all=1) for the approvals panel.
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  if (url.searchParams.get("all") === "1") {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response
    const rows = await prisma.moduleState.findMany({ where: { userId: FACE_SCOPE } })
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, department: true, deactivatedAt: true },
    })
    const byId = new Map(users.map((u) => [u.id, u]))
    const enrollments = rows
      .map((r) => {
        const data = r.data as FaceData
        const u = byId.get(r.key)
        return {
          userId: r.key,
          userName: u?.name ?? "Unknown",
          department: u?.department ?? null,
          active: !u?.deactivatedAt,
          status: data?.status ?? "pending",
          enrolledAt: data?.enrolledAt ?? null,
          reviewedAt: data?.reviewedAt ?? null,
          reviewedBy: data?.reviewedBy ?? null,
        }
      })
      .sort((a, b) => (a.enrolledAt < b.enrolledAt ? 1 : -1))
    return NextResponse.json({ enrollments })
  }

  const own = await readEnrollment(session.user.id)
  return NextResponse.json({
    status: own?.status ?? "none",
    enrolledAt: own?.enrolledAt ?? null,
    reviewedAt: own?.reviewedAt ?? null,
  })
}

// POST — self-service enrollment. An APPROVED face can never be replaced by
// its owner: only an admin reset unlocks re-registration.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const limited = rateLimit(request, { name: "face-enroll", limit: 10, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const descriptor = parseDescriptor(body?.descriptor)
  if (!descriptor) {
    return NextResponse.json(
      { error: "Invalid face data. Capture your face again." },
      { status: 400 },
    )
  }

  const existing = await readEnrollment(session.user.id)
  if (existing?.status === "approved") {
    return NextResponse.json(
      { error: "Your face is already registered. Ask an admin to reset it before registering again." },
      { status: 409 },
    )
  }

  const data: FaceData = {
    descriptor,
    status: "pending",
    enrolledAt: new Date().toISOString(),
  }
  await prisma.moduleState.upsert({
    where: { userId_key: { userId: FACE_SCOPE, key: session.user.id } },
    create: { userId: FACE_SCOPE, key: session.user.id, data: data as unknown as Prisma.InputJsonValue },
    update: { data: data as unknown as Prisma.InputJsonValue },
  })

  return NextResponse.json({ ok: true, status: "pending" })
}

// PATCH — admin approval workflow: approve / reject / reset (delete so the
// person can register again).
export async function PATCH(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await request.json().catch(() => null)
  const userId = typeof body?.userId === "string" ? body.userId : ""
  const action = typeof body?.action === "string" ? body.action : ""
  if (!userId || !["approve", "reject", "reset"].includes(action)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const existing = await readEnrollment(userId)
  if (!existing) {
    return NextResponse.json({ error: "No face registration found." }, { status: 404 })
  }

  if (action === "reset") {
    await prisma.moduleState.delete({
      where: { userId_key: { userId: FACE_SCOPE, key: userId } },
    })
    return NextResponse.json({ ok: true, status: "none" })
  }

  const data: FaceData = {
    ...existing,
    status: action === "approve" ? "approved" : "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy: guard.session.user.name ?? "Admin",
  }
  await prisma.moduleState.update({
    where: { userId_key: { userId: FACE_SCOPE, key: userId } },
    data: { data: data as unknown as Prisma.InputJsonValue },
  })
  return NextResponse.json({ ok: true, status: data.status })
}
