import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { requireAdmin, isRole } from "@/lib/auth-guards"
import { DEPARTMENTS } from "@/lib/data/types"

type RouteContext = { params: Promise<{ id: string }> }

// Change a member's role / department / manager. Admins only.
export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const data: { role?: string; department?: string | null; managerId?: string | null } = {}
  if (typeof body.role === "string" && body.role) {
    if (!isRole(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 })
    }
    if (id === auth.session.user.id) {
      return NextResponse.json(
        { error: "You can't change your own role here." },
        { status: 400 },
      )
    }
    data.role = body.role
  }
  if (typeof body.department === "string") {
    const dept = body.department.trim()
    // The shared employees document validates department against the
    // DEPARTMENTS enum — a free-text value here would poison it and make
    // every later directory write fail validation.
    if (dept && !(DEPARTMENTS as readonly string[]).includes(dept)) {
      return NextResponse.json({ error: "Unknown department." }, { status: 400 })
    }
    data.department = dept || null
  }
  if (typeof body.managerId === "string") {
    const managerId = body.managerId || null
    if (managerId) {
      if (managerId === id) {
        return NextResponse.json(
          { error: "A member can't be their own manager." },
          { status: 400 },
        )
      }
      const manager = await prisma.user.findUnique({ where: { id: managerId } })
      if (!manager || manager.deactivatedAt) {
        return NextResponse.json(
          { error: "That reporting manager doesn't exist." },
          { status: 400 },
        )
      }
    }
    data.managerId = managerId
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 })
  }
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target || target.deactivatedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await prisma.user.update({ where: { id }, data: data as Prisma.UserUncheckedUpdateInput })
  return NextResponse.json({ ok: true })
}

// Soft-deactivate (remove) a member. Admins only; you can't remove yourself.
export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  if (id === auth.session.user.id) {
    return NextResponse.json({ error: "You can't remove your own account here." }, { status: 400 })
  }
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target || target.deactivatedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await prisma.user.update({ where: { id }, data: { deactivatedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
