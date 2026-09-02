import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"

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

// Registration endpoint — creates a User (credentials) with the least-privilege
// "employee" role. Personal module state (settings, assistant) is seeded lazily
// on first read by /api/store/[key].
export async function POST(request: Request) {
  const limited = rateLimit(request, { name: "register", limit: 30, windowMs: 60 * 60_000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    )
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Enter your full name." },
      { status: 400 },
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid work email." },
      { status: 400 },
    )
  }
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 400 },
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "An account with that email already exists." },
      { status: 409 },
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: "employee",
      initials: initialsFromName(name),
    },
  })

  return NextResponse.json({ ok: true })
}
