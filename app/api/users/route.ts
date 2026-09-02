import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomInt } from "crypto"

import { prisma } from "@/lib/db"
import { requireAdmin, isRole } from "@/lib/auth-guards"

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let out = ""
  for (let i = 0; i < 12; i += 1) {
    out += chars[randomInt(chars.length)]
  }
  return out
}

// Team members — real User records (active only). Admins only.
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const users = await prisma.user.findMany({
    where: { deactivatedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      initials: true,
      department: true,
      managerId: true,
      createdAt: true,
      twoFactorEnabled: true,
    },
  })
  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name ?? "",
      email: u.email,
      role: u.role,
      initials: u.initials,
      department: u.department,
      managerId: u.managerId,
      twoFactorEnabled: u.twoFactorEnabled,
      joinedAt: u.createdAt.toISOString().slice(0, 10),
    })),
  )
}

// Create a team member (no email transport needed — the temp password is shown
// to the admin to share with the member). Admins only; role must be a known value.
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const rawRole = typeof body?.role === "string" ? body.role : "employee"
  const role = isRole(rawRole) ? rawRole : "employee"
  const department = typeof body?.department === "string" && body.department ? body.department : null
  const managerId = typeof body?.managerId === "string" && body.managerId ? body.managerId : null

  if (name.length < 2) {
    return NextResponse.json({ error: "Enter the member's full name." }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 })
  }

  // The reporting manager must be a real, active account.
  if (managerId) {
    const manager = await prisma.user.findUnique({ where: { id: managerId } })
    if (!manager || manager.deactivatedAt) {
      return NextResponse.json({ error: "That reporting manager doesn't exist." }, { status: 400 })
    }
  }

  const password = tempPassword()
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      department,
      managerId,
      initials: initialsFromName(name),
      password: hash,
    },
  })

  return NextResponse.json({
    ok: true,
    member: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      initials: user.initials,
    },
    tempPassword: password,
  })
}
