import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/terms", "/privacy"]
const PUBLIC_PREFIXES = ["/api/auth"]

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

// Modules restricted to admins — non-admins can't navigate here even by URL.
const ADMIN_ONLY_ROUTES = [
  "/organization",
  "/recruitment",
  "/reports",
  "/analytics",
  "/payroll",
  "/documents",
  "/jobs",
]

// Modules restricted to admins + managers. Onboarding is intentionally not
// here: employees may view their own checklist (read-only) there.
const MANAGER_ROUTES = ["/employees"]

// Defense in depth for APIs whose handlers are all admin-only. If a future
// handler forgets its own requireAdmin(), the proxy still fails closed.
// Store routes are deliberately absent: they have their own per-key gate.
const ADMIN_ONLY_API_PREFIXES = [
  "/api/users",
  "/api/billing",
  "/api/jobs",
  "/api/reports",
  "/api/documents",
  "/api/payroll",
]

function isAdminOnlyApi(pathname: string): boolean {
  return ADMIN_ONLY_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

function isAdminOnly(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))
}

function isManagerOnly(pathname: string): boolean {
  return MANAGER_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))
}

/**
 * The host the user actually typed. The auth() wrapper normalizes
 * req.nextUrl.origin to NEXTAUTH_URL, so with a NEXTAUTH_URL/port mismatch
 * every redirect would send users to a possibly-dead host. Deriving from the
 * Host header keeps redirects on the live origin (behind proxies,
 * x-forwarded-host/proto carry the public host).
 */
function originOf(req: { headers: Headers; nextUrl: URL }): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  const proto = req.headers.get("x-forwarded-proto") ?? "http"
  if (host) return `${proto}://${host}`
  return req.nextUrl.origin
}

// Next.js 16: `middleware.ts` is renamed to `proxy.ts` (node runtime).
export default auth((req) => {
  const { pathname } = req.nextUrl
  const signedIn = !!req.auth
  const role = req.auth?.user?.role

  // Protect everything that isn't public.
  if (!signedIn && !isPublic(pathname)) {
    // API callers get a clean 401 instead of a redirect: fetch follows
    // redirects silently, so a login-page redirect would come back as HTML
    // and mask the session-expiry error from the client.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = new URL("/login", originOf(req))
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect away from auth pages + landing when already signed in.
  if (
    signedIn &&
    (pathname === "/" ||
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password")
  ) {
    return NextResponse.redirect(new URL("/dashboard", originOf(req)))
  }

  // Admin-only APIs fail closed with JSON, never a page redirect.
  if (signedIn && role !== "admin" && pathname.startsWith("/api/") && isAdminOnlyApi(pathname)) {
    return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 })
  }

  // Role-based route protection (matches nav-data + server ADMIN_ONLY_KEYS).
  if (signedIn && role !== "admin") {
    if (isAdminOnly(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", originOf(req)))
    }
    if (role !== "manager" && isManagerOnly(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", originOf(req)))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Run on everything except Next internals, the auth API, and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
