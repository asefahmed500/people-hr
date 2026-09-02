// Minimal in-memory fixed-window rate limiter for sensitive, unauthenticated
// endpoints (password reset, registration, login pre-check). Best-effort:
// per-process, so it resets on restart and doesn't shard across instances —
// but it blunts credential-stuffing and email-bombing on a single-node deploy.

import { NextResponse } from "next/server"

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Periodically sweep expired buckets so the map can't grow unbounded.
const SWEEP_INTERVAL = 10 * 60_000
let lastSweep = Date.now()

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "local"
}

/**
 * Returns a 429 response while the caller is over the limit, else null.
 * Keys on name + client IP so different endpoints don't share budgets.
 */
export function rateLimit(
  request: Request,
  opts: { name: string; limit: number; windowMs: number },
): NextResponse | null {
  const now = Date.now()
  sweep(now)

  const key = `${opts.name}:${clientIp(request)}`
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return null
  }
  bucket.count += 1
  if (bucket.count > opts.limit) {
    const retryInSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryInSec} second(s).` },
      { status: 429, headers: { "Retry-After": String(retryInSec) } },
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// Failed-login lockout: after repeated failures for one account, further
// sign-in attempts for that email are rejected for a cooldown window. Blunts
// password brute-forcing against a known account (IP-only limits don't —
// attackers rotate IPs). In-memory, per-process, like the limiter above.
// ---------------------------------------------------------------------------

const LOGIN_FAIL_LIMIT = 8
const LOGIN_LOCK_MS = 15 * 60_000

const loginFails = new Map<string, { count: number; lockedUntil: number }>()

let lastLoginSweep = Date.now()

function sweepLogins(now: number) {
  if (now - lastLoginSweep < SWEEP_INTERVAL) return
  lastLoginSweep = now
  for (const [key, entry] of loginFails) {
    if (entry.lockedUntil <= now && entry.count === 0) loginFails.delete(key)
  }
}

function normEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** True while the account is locked out after repeated failed sign-ins. */
export function isLoginLocked(email: string): boolean {
  const now = Date.now()
  sweepLogins(now)
  const entry = loginFails.get(normEmail(email))
  return !!entry && entry.lockedUntil > now
}

export function recordLoginFailure(email: string): void {
  const now = Date.now()
  sweepLogins(now)
  const key = normEmail(email)
  const entry = loginFails.get(key) ?? { count: 0, lockedUntil: 0 }
  entry.count += 1
  if (entry.count >= LOGIN_FAIL_LIMIT) {
    entry.lockedUntil = now + LOGIN_LOCK_MS
    entry.count = 0
  }
  loginFails.set(key, entry)
}

export function recordLoginSuccess(email: string): void {
  loginFails.delete(normEmail(email))
}
