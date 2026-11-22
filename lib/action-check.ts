// One entry point for every mutating user action: authentication, role
// authorization, zod input validation and a per-user rate limit. Handlers can
// still add resource-level ownership checks; this helper guarantees the four
// checks that must never be skipped by a route.

import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { z } from "zod"

import { requireRole, type Role } from "@/lib/auth-guards"
import { rateLimit } from "@/lib/rate-limit"

export type CheckedContext<S extends z.ZodType> = {
  session: Session
  input: z.output<S>
}

type CheckResult<S extends z.ZodType> =
  | { ok: true; ctx: CheckedContext<S> }
  | { ok: false; response: NextResponse }

/**
 * Call at the top of every mutating route. Returns a ready-made 401/403/429/400
 * response on failure, so a handler can never accidentally skip a check.
 */
export async function checkAction<S extends z.ZodType>(
  request: Request,
  opts: {
    roles: Role[]
    schema: S
    rateLimit?: { name: string; limit: number; windowMs: number }
  },
): Promise<CheckResult<S>> {
  const auth = await requireRole(...opts.roles)
  if (!auth.ok) return auth

  const limited = opts.rateLimit
    ? rateLimit(request, { ...opts.rateLimit, subject: auth.session.user.id })
    : null
  if (limited) return { ok: false, response: limited }

  const raw = await request.json().catch(() => null)
  const parsed = opts.schema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Invalid input.",
          issues: parsed.error.issues.slice(0, 5).map((issue) => ({
            path: issue.path.map(String).join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      ),
    }
  }

  return { ok: true, ctx: { session: auth.session, input: parsed.data } }
}
