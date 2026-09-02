import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { DEPARTMENTS } from "@/lib/data/types"

// Maximum serialized size for a base64 avatar data URL (~300 KB of image).
const MAX_AVATAR_LENGTH = 400_000

// Update the real User record (name / email / avatar) from the settings
// profile. Department is intentionally NOT self-serviceable for non-admins:
// it drives manager data-scoping (lib/non-admin-merge, filterForRole), so a
// manager editing their own department would re-scope them onto another
// team's data. Only admins may change it.
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 })
  }

  const data: {
    name?: string
    email?: string
    department?: string
    image?: string
    initials?: string
  } = {}

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    const name: string = body.name.trim()
    data.name = name
    data.initials = name
      .split(/\s+/)
      .map((p: string) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  if (body.email !== undefined) {
    if (typeof body.email !== "string" || !/.+@.+\..+/.test(body.email.trim())) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }
    const email = body.email.trim().toLowerCase()
    const other = await prisma.user.findUnique({ where: { email } })
    if (other && other.id !== session.user.id) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 })
    }
    data.email = email
  }

  if (typeof body.department === "string") {
    if (session.user.role !== "admin") {
      // Silently ignored for non-admins — the field is read-only in their UI;
      // department changes go through the admin Team page instead.
      void body.department
    } else {
      const dept = body.department.trim()
      // Same constraint as the admin Team page: only known departments, so the
      // employees document (enum-validated) can't be poisoned.
      if (dept && !(DEPARTMENTS as readonly string[]).includes(dept)) {
        return NextResponse.json({ error: "Unknown department." }, { status: 400 })
      }
      data.department = dept || null
    }
  }

  if (typeof body.avatar === "string") {
    if (body.avatar.length > MAX_AVATAR_LENGTH) {
      return NextResponse.json(
        { error: "That image is too large. Pick one under 300 KB." },
        { status: 413 },
      )
    }
    data.image = body.avatar.trim() || null
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
  })

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      initials: updated.initials,
      department: updated.department,
      image: updated.image,
    },
  })
}
