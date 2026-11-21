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
  // A literal JSON `null` parses to null and would throw on body.role below.
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 })
  }
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
      // Match POST /api/users: only active admins/managers may be assigned as
      // a reporting manager, otherwise manager-scoped data rules break.
      if (!manager || manager.deactivatedAt || !["admin", "manager"].includes(manager.role)) {
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

  // Keep the shared employees directory in sync. Manager leave scoping and
  // organization headcounts read that document, not the User row.
  if (data.department !== undefined) {
    try {
      const empDoc = await prisma.moduleState.findUnique({
        where: { userId_key: { userId: "__workspace__", key: "employees" } },
      })
      if (Array.isArray(empDoc?.data)) {
        const rows = empDoc!.data as Array<Record<string, unknown>>
        let changed = false
        for (const row of rows) {
          if (row.id === id || (!!row.email && row.email === target?.email)) {
            if (row.department !== data.department) {
              row.department = data.department
              changed = true
            }
          }
        }
        if (changed) {
          await prisma.moduleState.update({
            where: { userId_key: { userId: "__workspace__", key: "employees" } },
            data: { data: rows as unknown as Prisma.InputJsonValue },
          })
        }
      }
    } catch {
      // Directory sync is best-effort; the User row is authoritative for auth.
    }
  }

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
