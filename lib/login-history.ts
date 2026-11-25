// Durable sign-in audit trail + session revocation epoch.
//
// Both live in one reserved ModuleState document per user
// (userId = "__loginhistory__", key = the real user's id). This reuses the
// existing JSON-document storage without any schema change. Writes use the
// same compare-and-swap-on-`updatedAt` retry pattern as lib/rate-limit.ts so
// concurrent sign-ins don't silently drop events.
//
// Privacy: the raw IP is never persisted — we store a salted, truncated
// SHA-256 digest instead — and the user-agent string is reduced to a short
// "Browser · OS" label.

import { createHash, randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import type { SignInEvent } from "@/lib/data/settings"

export const LOGIN_HISTORY_SCOPE = "__loginhistory__"

const MAX_EVENTS = 10
const CAS_RETRIES = 3

export type LoginHistoryDoc = {
  events: SignInEvent[]
  sessionEpoch: number
  /** Sign-in ids explicitly signed out. A JWT refresh that was already in
   *  flight when Sign out ran can re-set the session cookie after Auth.js
   *  cleared it; checking this list on every request kills that race. */
  revokedSignInIds: string[]
}

const MAX_REVOKED = 100

const EMPTY_DOC: LoginHistoryDoc = { events: [], sessionEpoch: 0, revokedSignInIds: [] }

type StoredRow = { data: Prisma.JsonValue; updatedAt: Date }

function uniqueWhere(userId: string) {
  return { userId_key: { userId: LOGIN_HISTORY_SCOPE, key: userId } }
}

function manyWhere(userId: string) {
  return { userId: LOGIN_HISTORY_SCOPE, key: userId }
}

function isSignInEvent(value: unknown): value is SignInEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === "string" &&
    typeof v.at === "string" &&
    typeof v.ip === "string" &&
    typeof v.userAgent === "string"
  )
}

function parseDoc(value: unknown): LoginHistoryDoc {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...EMPTY_DOC }
  }
  const obj = value as Record<string, unknown>
  const events = Array.isArray(obj.events)
    ? obj.events.filter(isSignInEvent).slice(0, MAX_EVENTS)
    : []
  const sessionEpoch =
    typeof obj.sessionEpoch === "number" && Number.isFinite(obj.sessionEpoch)
      ? obj.sessionEpoch
      : 0
  const revokedSignInIds = Array.isArray(obj.revokedSignInIds)
    ? obj.revokedSignInIds.filter((id): id is string => typeof id === "string").slice(-MAX_REVOKED)
    : []
  return { events, sessionEpoch, revokedSignInIds }
}

function asJson(value: LoginHistoryDoc): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue
}

async function readRow(userId: string): Promise<StoredRow | null> {
  return prisma.moduleState.findUnique({
    where: uniqueWhere(userId),
    select: { data: true, updatedAt: true },
  }) as Promise<StoredRow | null>
}

// --- public API -------------------------------------------------------------

export async function getLoginHistory(userId: string): Promise<LoginHistoryDoc> {
  try {
    const row = await readRow(userId)
    return row ? parseDoc(row.data) : { ...EMPTY_DOC }
  } catch {
    return { ...EMPTY_DOC, events: [] }
  }
}

/** Returns the epoch only when one is actually stored (legacy docs are skipped). */
export async function getSessionEpoch(userId: string): Promise<number | null> {
  return (await getSessionSecurity(userId)).epoch
}

/**
 * Everything the JWT callback needs to validate a token, read in one query.
 * `revokedSignInIds` closes the sign-out/session-refresh race: Auth.js clears
 * the cookie on Sign out, but an in-flight `GET /api/auth/session` can re-set
 * it afterwards with a freshly signed copy of the old token.
 */
export async function getSessionSecurity(userId: string): Promise<{
  epoch: number | null
  revokedSignInIds: string[]
}> {
  try {
    const row = await readRow(userId)
    if (!row) return { epoch: null, revokedSignInIds: [] }
    const doc = parseDoc(row.data)
    return { epoch: doc.sessionEpoch, revokedSignInIds: doc.revokedSignInIds }
  } catch {
    return { epoch: null, revokedSignInIds: [] }
  }
}

/** Mark one sign-in as ended so its JWT is rejected on the next request. */
export async function revokeSignIn(userId: string, signInId: string): Promise<void> {
  if (!userId || !signInId) return
  for (let attempt = 0; attempt < CAS_RETRIES; attempt++) {
    try {
      const row = await readRow(userId)
      if (!row) {
        await prisma.moduleState.create({
          data: {
            userId: LOGIN_HISTORY_SCOPE,
            key: userId,
            data: asJson({ ...EMPTY_DOC, revokedSignInIds: [signInId] }),
          },
        })
        return
      }
      const doc = parseDoc(row.data)
      if (doc.revokedSignInIds.includes(signInId)) return
      const next: LoginHistoryDoc = {
        ...doc,
        revokedSignInIds: [...doc.revokedSignInIds, signInId].slice(-MAX_REVOKED),
      }
      const swapped = await prisma.moduleState.updateMany({
        where: { ...manyWhere(userId), updatedAt: row.updatedAt },
        data: { data: asJson(next) },
      })
      if (swapped.count > 0) return
    } catch {
      // Best effort: a failed revocation write must not break Sign out.
    }
  }
}

/**
 * Prepend a successful sign-in, keeping only the newest MAX_EVENTS entries.
 * Returns the id recorded with the event plus the current session epoch, so
 * both can be embedded in the freshly issued JWT without another DB read.
 */
export async function recordSignInEvent(
  userId: string,
  meta: { ip: string; userAgent: string },
): Promise<{ id: string; epoch: number }> {
  const id = randomUUID()
  const event: SignInEvent = {
    id,
    at: new Date().toISOString(),
    ip: meta.ip,
    userAgent: meta.userAgent,
  }

  for (let attempt = 0; attempt < CAS_RETRIES; attempt++) {
    try {
      const row = await readRow(userId)
      if (!row) {
        await prisma.moduleState.create({
          data: {
            userId: LOGIN_HISTORY_SCOPE,
            key: userId,
            data: asJson({ ...EMPTY_DOC, events: [event] }),
          },
        })
        return { id, epoch: 0 }
      }

      const doc = parseDoc(row.data)
      const next: LoginHistoryDoc = {
        ...doc,
        events: [event, ...doc.events].slice(0, MAX_EVENTS),
      }
      const swapped = await prisma.moduleState.updateMany({
        where: { ...manyWhere(userId), updatedAt: row.updatedAt },
        data: { data: asJson(next) },
      })
      if (swapped.count > 0) return { id, epoch: next.sessionEpoch }
    } catch {
      // A concurrent create can lose the unique race — retry via read → update.
    }
  }

  // Best effort: sign-in must never fail because the audit write did.
  return { id, epoch: 0 }
}

/** Invalidate every previously issued JWT for this user. */
export async function bumpSessionEpoch(userId: string): Promise<number> {
  for (let attempt = 0; attempt < CAS_RETRIES; attempt++) {
    const row = await readRow(userId)
    if (!row) {
      await prisma.moduleState.create({
        data: {
          userId: LOGIN_HISTORY_SCOPE,
          key: userId,
          data: asJson({ ...EMPTY_DOC, sessionEpoch: 1 }),
        },
      })
      return 1
    }

    const doc = parseDoc(row.data)
    const epoch = doc.sessionEpoch + 1
    const swapped = await prisma.moduleState.updateMany({
      where: { ...manyWhere(userId), updatedAt: row.updatedAt },
      data: { data: asJson({ ...doc, sessionEpoch: epoch }) },
    })
    if (swapped.count > 0) return epoch
  }
  throw new Error("Could not revoke sessions. Please try again.")
}

// --- request metadata -------------------------------------------------------

function envTruthy(value: string | undefined): boolean {
  if (!value) return false
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase())
}

function parseUserAgent(ua: string): string {
  if (!ua) return "Unknown device"
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Firefox/")
      ? "Firefox"
      : ua.includes("Chrome/")
        ? "Chrome"
        : ua.includes("Safari/")
          ? "Safari"
          : "Browser"
  const os = ua.includes("Windows NT")
    ? "Windows"
    : ua.includes("iPhone") || ua.includes("iPad")
      ? "iOS"
      : ua.includes("Mac OS X")
        ? "macOS"
        : ua.includes("Android")
          ? "Android"
          : ua.includes("Linux")
            ? "Linux"
            : "Unknown OS"
  return `${browser} · ${os}`.slice(0, 80)
}

/** Extract privacy-conscious sign-in metadata from the original auth request. */
export function signInMetaFromRequest(request: Request): { ip: string; userAgent: string } {
  let rawIp = ""
  if (envTruthy(process.env.TRUST_PROXY)) {
    const fwd = request.headers.get("x-forwarded-for")
    if (fwd) rawIp = fwd.split(",")[0].trim()
  }
  if (!rawIp) rawIp = request.headers.get("x-real-ip")?.trim() || "local"

  const salt = process.env.AUTH_SECRET ?? ""
  const ip = createHash("sha256")
    .update(salt ? `${salt}:${rawIp}` : rawIp)
    .digest("hex")
    .slice(0, 12)

  return { ip, userAgent: parseUserAgent(request.headers.get("user-agent") ?? "") }
}
