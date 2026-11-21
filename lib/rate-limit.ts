// Durable, best-effort rate limiting for sensitive, unauthenticated endpoints
// (password reset, registration, login pre-check) and failed-login lockout.
//
// The decision path stays SYNCHRONOUS so existing callers don't need to change:
// a process-local mirror answers immediately, while state is persisted to the
// existing ModuleState table under reserved scopes (`__ratelimit__` /
// `__loginlock__`). The mirror is hydrated from the DB on first use and after
// that every change is written through with a compare-and-swap on `updatedAt`
// plus a couple of retries. This survives restarts (unlike a pure in-memory
// map) and eventually converges across processes sharing the same database.
//
// `x-forwarded-for` is only trusted when TRUST_PROXY is a truthy value;
// otherwise the client key falls back to `x-real-ip` or a stable "local" key.

import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"

type Bucket = { count: number; resetAt: number }
type Lock = { count: number; lockedUntil: number }

const RATE_SCOPE = "__ratelimit__"
const LOGIN_SCOPE = "__loginlock__"
const CAS_RETRIES = 3
const SWEEP_INTERVAL = 10 * 60_000

const LOGIN_FAIL_LIMIT = 8
const LOGIN_LOCK_MS = 15 * 60_000

// Mirrors. The synchronous API reads/writes these; the DB is the durable source
// they are hydrated from and written through to.
const buckets = new Map<string, Bucket>()
const loginFails = new Map<string, Lock>()

let hydrationPromise: Promise<void> | null = null
let lastSweep = Date.now()

function usesDatabase(): boolean {
  // Edge runtime has no Prisma client; fall back to the in-memory mirror only.
  return process.env.NEXT_RUNTIME !== "edge"
}

function envTruthy(value: string | undefined): boolean {
  if (!value) return false
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase())
}

function clientIp(request: Request): string {
  if (envTruthy(process.env.TRUST_PROXY)) {
    const fwd = request.headers.get("x-forwarded-for")
    if (fwd) {
      const first = fwd.split(",")[0].trim()
      if (first) return first
    }
  }
  // x-real-ip is client-controlled unless a trusted proxy overwrites it.
  // Honouring it by default lets callers mint unlimited rate-limit buckets.
  return "local"
}

function normEmail(email: string): string {
  return email.trim().toLowerCase()
}

// --- durability -------------------------------------------------------------

async function hydrate(): Promise<void> {
  if (!usesDatabase()) return
  try {
    const rows = await prisma.moduleState.findMany({
      where: { userId: { in: [RATE_SCOPE, LOGIN_SCOPE] } },
    })
    for (const row of rows) {
      const data = row.data as { count?: number; resetAt?: number; lockedUntil?: number }
      if (typeof data?.count !== "number") continue
      if (row.userId === RATE_SCOPE) {
        buckets.set(row.key, { count: data.count, resetAt: data.resetAt ?? 0 })
      } else {
        loginFails.set(row.key, { count: data.count, lockedUntil: data.lockedUntil ?? 0 })
      }
    }
  } catch {
    // Hydration is best-effort; a cold first request may start from zero.
  }
}

/** Warm the durable state into memory. Safe to call multiple times. */
export function hydrateRateLimitState(): Promise<void> {
  if (!hydrationPromise) hydrationPromise = hydrate()
  return hydrationPromise
}
void hydrateRateLimitState()

/** Read → update with a CAS guard on `updatedAt` and a couple of retries. */
async function persist(scope: string, key: string, value: Bucket | Lock): Promise<void> {
  if (!usesDatabase()) return
  for (let attempt = 0; attempt < CAS_RETRIES; attempt++) {
    try {
      const row = await prisma.moduleState.findUnique({
        where: { userId_key: { userId: scope, key } },
      })
      if (!row) {
        await prisma.moduleState.create({
          data: { userId: scope, key, data: value as unknown as Prisma.InputJsonValue },
        })
        return
      }
      const swapped = await prisma.moduleState.updateMany({
        where: { userId: scope, key, updatedAt: row.updatedAt },
        data: { data: value as unknown as Prisma.InputJsonValue },
      })
      if (swapped.count > 0) return

      // Lost the race: never let a stale writer lower another process's count.
      const current = row.data as { count?: number }
      if (typeof current?.count === "number") {
        value.count = Math.max(value.count, current.count)
      }
    } catch {
      // A create can lose a unique-race with another process; retry via the
      // read → update path. Still best effort — never fail the request.
      continue
    }
  }
}

async function pruneExpiredRows(now: number): Promise<void> {
  if (!usesDatabase()) return
  try {
    const rows = await prisma.moduleState.findMany({
      where: { userId: { in: [RATE_SCOPE, LOGIN_SCOPE] } },
      select: { id: true, userId: true, data: true },
    })
    const expiredIds = rows
      .filter((row) => {
        const data = row.data as { resetAt?: number; lockedUntil?: number; count?: number }
        if (row.userId === RATE_SCOPE) {
          return typeof data?.resetAt === "number" && data.resetAt <= now
        }
        return (
          typeof data?.lockedUntil === "number" &&
          data.lockedUntil <= now &&
          (!data.count || data.count === 0)
        )
      })
      .map((row) => row.id)
    if (expiredIds.length) {
      await prisma.moduleState.deleteMany({ where: { id: { in: expiredIds } } })
    }
  } catch {
    // Best effort.
  }
}

/** Sweep local mirrors and, occasionally, expired DB rows too. */
function maybePrune(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  for (const [key, entry] of loginFails) {
    if (entry.lockedUntil <= now && entry.count === 0) loginFails.delete(key)
  }
  void pruneExpiredRows(now)
}

// --- public API (synchronous, unchanged signatures) -------------------------

/**
 * Returns a 429 response while the caller is over the limit, else null.
 * Keys on name + client IP so different endpoints don't share budgets.
 */
export function rateLimit(
  request: Request,
  opts: { name: string; limit: number; windowMs: number },
): NextResponse | null {
  const now = Date.now()
  maybePrune(now)

  const key = `${opts.name}:${clientIp(request)}`
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + opts.windowMs }
    buckets.set(key, fresh)
    void persist(RATE_SCOPE, key, { ...fresh })
    return null
  }

  bucket.count += 1
  // Pass a copy so the fire-and-forget write can't race later mutations.
  void persist(RATE_SCOPE, key, { ...bucket })
  if (bucket.count > opts.limit) {
    const retryInSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryInSec} second(s).` },
      { status: 429, headers: { "Retry-After": String(retryInSec) } },
    )
  }
  return null
}

/** True while the account is locked out after repeated failed sign-ins. */
export function isLoginLocked(email: string): boolean {
  const now = Date.now()
  maybePrune(now)
  const entry = loginFails.get(normEmail(email))
  return !!entry && entry.lockedUntil > now
}

export function recordLoginFailure(email: string): void {
  const now = Date.now()
  maybePrune(now)
  const key = normEmail(email)
  const entry = loginFails.get(key) ?? { count: 0, lockedUntil: 0 }
  entry.count += 1
  if (entry.count >= LOGIN_FAIL_LIMIT) {
    entry.lockedUntil = now + LOGIN_LOCK_MS
    entry.count = 0
  }
  loginFails.set(key, entry)
  void persist(LOGIN_SCOPE, key, { ...entry })
}

export function recordLoginSuccess(email: string): void {
  const key = normEmail(email)
  loginFails.delete(key)
  if (usesDatabase()) {
    void prisma.moduleState.deleteMany({ where: { userId: LOGIN_SCOPE, key } }).catch(() => {})
  }
}
