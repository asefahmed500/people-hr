import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"

// Face check-in: the client posts only a face descriptor. Identity is derived
// SERVER-SIDE by nearest-neighbor matching against APPROVED enrollments, then
// checked against the authenticated session — BOTH the face and the session
// must identify the same person. A photo of a colleague therefore cannot be
// used to check in as them.
//
// Check-ins are written into the shared attendance module document (same
// shape the attendance page uses) with a compare-and-swap retry so two
// simultaneous check-ins can't overwrite each other.

const FACE_SCOPE = "__faceid__"
const WORKSPACE_ID = "__workspace__"
// Human library face embeddings (1024 floats).
const DESCRIPTOR_LENGTH = 1024
// Similarity boundary: Human's normalized similarity of 0.5 (its recommended
// same-person threshold) corresponds to a raw Euclidean distance of ~0.5 with
// the library's default similarity curve — we stay at or below it.
const MATCH_THRESHOLD = 0.5
const ON_TIME_UNTIL = "09:30"

function parseDescriptor(input: unknown): number[] | null {
  if (!Array.isArray(input) || input.length !== DESCRIPTOR_LENGTH) return null
  const out: number[] = []
  for (const v of input) {
    // Bound the magnitude as well as the type: normalized Human embeddings are
    // small, and a 1024-element array of huge floats would make distance()
    // overflow to Infinity and burn CPU for no reason.
    if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 100) return null
    out.push(v)
  }
  return out
}

function distance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i]
    sum += d * d
  }
  return Math.sqrt(sum)
}

type CheckIn = {
  id: string
  /** Stable account id — display names are mutable and not unique. */
  userId?: string
  initials: string
  name: string
  dept: string
  time: string
  status: "on-time" | "late" | "remote"
  date: string
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const limited = rateLimit(request, { name: "face-checkin", limit: 20, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const descriptor = parseDescriptor(body?.descriptor)
  if (!descriptor) {
    return NextResponse.json({ error: "Invalid face data. Try the scan again." }, { status: 400 })
  }

  // 1. Match against approved enrollments.
  const rows = await prisma.moduleState.findMany({ where: { userId: FACE_SCOPE } })
  let best: { userId: string; dist: number } | null = null
  for (const row of rows) {
    const data = row.data as { descriptor?: number[]; status?: string }
    if (data?.status !== "approved" || !Array.isArray(data.descriptor)) continue
    const dist = distance(descriptor, data.descriptor)
    if (!best || dist < best.dist) best = { userId: row.key, dist }
  }
  if (!best || best.dist > MATCH_THRESHOLD) {
    return NextResponse.json(
      { error: "No registered face matched. Ask an admin to check your registration." },
      { status: 404 },
    )
  }

  // 1b. The matched face must belong to the signed-in account. Without this
  // check, anyone holding a photo of an enrolled employee could check in as
  // them — the face alone is not an identity proof.
  if (best.userId !== session.user.id) {
    return NextResponse.json(
      { error: "This face is registered to a different account." },
      { status: 403 },
    )
  }

  // 2. The matched account must still be active.
  const user = await prisma.user.findUnique({ where: { id: best.userId } })
  if (!user || user.deactivatedAt) {
    return NextResponse.json({ error: "This face belongs to an inactive account." }, { status: 404 })
  }

  // 3. Record the check-in (one per person per day) with a CAS retry so
  // concurrent check-ins can't clobber each other in the shared document.
  const now = new Date()
  // Keep the UTC date key used everywhere else in the attendance module.
  const today = now.toISOString().slice(0, 10)
  // Build the clock time explicitly: toLocaleTimeString("en-US", { hour12: false })
  // can emit "24:xx" at midnight on some ICU versions, which breaks the string
  // comparison against ON_TIME_UNTIL.
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const status: CheckIn["status"] = time <= ON_TIME_UNTIL ? "on-time" : "late"

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const doc = await prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key: "attendance" } },
    })
    const store = (doc?.data as { checkIns?: CheckIn[] } | undefined) ?? { checkIns: [] }
    const checkIns = store.checkIns ?? []
    const already = checkIns.find(
      (c) => (c.userId ? c.userId === session.user.id : c.name === user.name) && c.date === today,
    )
    if (already) {
      return NextResponse.json(
        { error: `You already checked in today (${already.time}).` },
        { status: 409 },
      )
    }
    const checkIn: CheckIn = {
      id: `ci-${crypto.randomUUID()}`,
      userId: session.user.id,
      initials:
        user.initials ||
        (user.name ?? "UN")
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
      name: user.name ?? "Unknown",
      dept: user.department ?? "People",
      time,
      status,
      date: today,
    }
    const nextStore = { checkIns: [checkIn, ...checkIns] }

    if (!doc) {
      try {
        await prisma.moduleState.create({
          data: {
            userId: WORKSPACE_ID,
            key: "attendance",
            data: nextStore as unknown as Prisma.InputJsonValue,
          },
        })
        return NextResponse.json({
          ok: true,
          matchDistance: Math.round(best.dist * 1000) / 1000,
          checkIn: { name: checkIn.name, time, status },
        })
      } catch {
        continue // lost a create race — re-read and retry
      }
    }

    const swapped = await prisma.moduleState.updateMany({
      where: { userId: WORKSPACE_ID, key: "attendance", updatedAt: doc.updatedAt },
      data: { data: nextStore as unknown as Prisma.InputJsonValue },
    })
    if (swapped.count > 0) {
      return NextResponse.json({
        ok: true,
        matchDistance: Math.round(best.dist * 1000) / 1000,
        checkIn: { name: checkIn.name, time, status },
      })
    }
    // CAS miss — another writer got between our read and write; retry.
  }

  return NextResponse.json(
    { error: "Attendance is busy right now. Try again in a moment." },
    { status: 409 },
  )
}
