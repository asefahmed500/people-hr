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
    department?: string | null
    image?: string | null
    initials?: string
  } = {}
  // Job title is stored in the personal settings document (User has no such
  // column). Validate it here so the settings page can persist it atomically
  // with the rest of the profile instead of relying on a debounced PUT.
  let jobTitle: string | undefined
  if (body.jobTitle !== undefined) {
    if (typeof body.jobTitle !== "string" || body.jobTitle.length > 120) {
      return NextResponse.json({ error: "Enter a valid job title." }, { status: 400 })
    }
    jobTitle = body.jobTitle.trim()
  }

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    const name: string = body.name.trim()
    // Display names are used to scope shared module rows for non-admins. If a
    // user could adopt someone else's name they would inherit that person's
    // records. Require names to be unique across accounts.
    // Only enforce uniqueness when actually changing the name — legacy rows
    // may already share a name, and saving unchanged profile data must work.
    if (name.toLowerCase() !== String(session.user.name ?? "").toLowerCase()) {
      const nameOwner = await prisma.user.findFirst({
        where: { name: { equals: name, mode: "insensitive" }, id: { not: session.user.id } },
        select: { id: true },
      })
      if (nameOwner) {
        return NextResponse.json({ error: "That name is already in use." }, { status: 409 })
      }
    }
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
    const avatar = body.avatar.trim()
    if (!avatar) {
      // Explicit "remove photo" signal from the settings avatar control.
      data.image = null
    } else {
      if (avatar.length > MAX_AVATAR_LENGTH) {
        return NextResponse.json(
          { error: "That image is too large. Pick one under 300 KB." },
          { status: 413 },
        )
      }
      // Only inline base64 images from the FileReader upload are accepted.
      // Rejecting other schemes keeps javascript:, http(s): and remote URLs
      // out of a field that is rendered directly into an <img src>.
      if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar)) {
        return NextResponse.json(
          { error: "Unsupported image format. Use a PNG, JPEG, or WebP image." },
          { status: 400 },
        )
      }
      data.image = avatar
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
  })

  // Keep the personal settings module in sync. The settings page shows values
  // from /api/store/settings while the session shows the User row — updating
  // only the latter left a stale form after "Saved changes".
  try {
    const where = { userId_key: { userId: session.user.id, key: "settings" } }
    const doc = await prisma.moduleState.findUnique({ where, select: { data: true, updatedAt: true } })
    if (doc && doc.data && typeof doc.data === "object" && !Array.isArray(doc.data)) {
      const state = doc.data as Record<string, unknown>
      const personal = (state.personal && typeof state.personal === "object" ? state.personal : {}) as Record<string, unknown>
      if (typeof updated.name === "string") personal.fullName = updated.name
      if (typeof updated.email === "string") personal.email = updated.email
      if (typeof jobTitle === "string") personal.jobTitle = jobTitle
      // CAS: a concurrent debounced store PUT must not be clobbered (or
      // clobber these values) just because the two writes overlapped.
      await prisma.moduleState.updateMany({
        where: {
          userId: session.user.id,
          key: "settings",
          updatedAt: doc.updatedAt,
        },
        data: { data: { ...state, personal } as object },
      })
    }
  } catch {
    // Settings sync is best-effort — never fail a profile save over it.
  }

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
