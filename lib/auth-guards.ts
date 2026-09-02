// Server-side authorization guards shared by every protected API route.
// Session is derived from `auth()` inside each guard so routes stay terse.

import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export type Role = "admin" | "manager" | "employee"

export const ROLES: Role[] = ["admin", "manager", "employee"]

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value)
}

type GuardResult = { ok: true; session: Session } | { ok: false; response: NextResponse }

function deny(message: string, status: number): GuardResult {
  return { ok: false, response: NextResponse.json({ error: message }, { status }) }
}

/** Any signed-in user. Use as the default auth check for personal routes. */
export async function requireAuth(): Promise<GuardResult> {
  const session = await auth()
  if (!session?.user?.id) return deny("Unauthorized", 401)
  return { ok: true, session }
}

/** Require a specific role (or any of a set of roles). */
export async function requireRole(...roles: Role[]): Promise<GuardResult> {
  const base = await requireAuth()
  if (!base.ok) return base
  if (!base.session.user.role || !roles.includes(base.session.user.role as Role)) {
    return deny("You don't have permission to do that.", 403)
  }
  return base
}

/** Require the admin role. */
export function requireAdmin(): Promise<GuardResult> {
  return requireRole("admin")
}

/** Require admin or manager. */
export function requireManager(): Promise<GuardResult> {
  return requireRole("admin", "manager")
}

/** Require admin to manage team members (list, invite, change roles, remove). */
export function requireUserManagement(): Promise<GuardResult> {
  return requireRole("admin")
}

/**
 * Server-component page guard. Redirects to /dashboard when the signed-in user
 * isn't in the allowed role set. Call before the page renders its JSX.
 */
export async function requirePageRole(...roles: Role[]): Promise<void> {
  const session = await auth()
  const role = session?.user?.role as Role | undefined
  if (!role) redirect("/dashboard")
  if (roles.length > 0 && !roles.includes(role)) redirect("/dashboard")
}
