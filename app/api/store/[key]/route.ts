import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { MODULE_DEFAULTS } from "@/lib/module-defaults"
import { STORE_SCHEMAS } from "@/lib/store-schemas"
import { computeAnalytics } from "@/lib/analytics"
import { mergeNonAdminWrite, type UserCtx } from "@/lib/non-admin-merge"
import { notifyLeaveChanges } from "@/lib/notify-server"
import { defaultBalances } from "@/lib/data/leave"
import { DEPARTMENTS } from "@/lib/data/types"
import { describeDocumentChange, recordActivity } from "@/lib/activity"
import { isOwnRecord } from "@/lib/role-scope"
import type { Employee } from "@/lib/data/employees"
import type { LeaveStore } from "@/lib/data/leave"
import type { RecruitmentStore } from "@/lib/data/recruitment"

type RouteContext = { params: Promise<{ key: string }> }

// Shared modules use a workspace-level scope so all users see the same data.
// Personal modules stay per-user.
const SHARED_KEYS = new Set([
  "employees", "leave", "recruitment", "projects", "goals",
  "payroll", "payslips", "performance", "onboarding", "attendance",
  "organization", "analytics", "reports", "documents", "announcements",
])
const WORKSPACE_ID = "__workspace__"

// Modules that only admins can access (read + write).
const ADMIN_ONLY_KEYS = new Set(["recruitment", "analytics", "reports", "organization", "payroll", "documents"])

function isKnownKey(key: string): boolean {
  return key in MODULE_DEFAULTS
}

function scopeFor(key: string, userId: string): string {
  return SHARED_KEYS.has(key) ? WORKSPACE_ID : userId
}

function emptyFor(key: string): unknown {
  switch (key) {
    case "employees": return []
    case "leave": return { requests: [], balances: {} }
    case "recruitment": return { candidates: [], openings: [] }
    case "projects": return { tasks: [] }
    case "goals": return { objectives: [] }
    case "payroll": return { payments: [], lastRun: null }
    case "payslips": return { payslips: [] }
    case "performance": return { reviews: [], teamScores: [] }
    case "onboarding": return { tasks: [] }
    case "attendance": return { checkIns: [] }
    case "organization": return { companyName: "", departments: [], offices: [], orgChart: [] }
    case "analytics": return {
      headcount: 0, headcountDelta: "", attrition: "", attritionDelta: "",
      avgTenure: "", avgTenureDelta: "", offerAcceptRate: "", offerAcceptRateDelta: "",
      monthlyTrend: [], byDept: [], byTenure: [],
    }
    case "reports": return { templates: [], scheduled: [], recent: [] }
    case "documents": return { documents: [] }
    case "announcements": return { announcements: [] }
    default: return {}
  }
}

type ActivitySessionUser = {
  id: string
  name: string | null
  department: string | null
  role: string
}

/**
 * Best-effort audit entry for a successful document replace. Only counts and
 * labels are derived — document bodies (and their values) never leave here.
 */
async function trackWrite(
  key: string,
  before: unknown,
  after: unknown,
  sessionUser: ActivitySessionUser,
) {
  const { action, summary } = describeDocumentChange(key, before, after)
  await recordActivity({
    actor: {
      id: sessionUser.id,
      name: sessionUser.name,
      department: sessionUser.department,
      role: sessionUser.role,
    },
    action,
    module: key,
    summary,
  })
}

/**
 * Post-read role-based filtering. Admins see everything.
 * Managers see their department's data. Employees see only their own records.
 * Admin-only modules resolve to empty structures for non-admins.
 */
function filterForRole(
  key: string,
  data: unknown,
  role: string,
  department: string | null,
  userName: string | null,
  userEmail: string | null,
  userId: string,
  managerDeptOf?: (name: string) => string | null,
): unknown {
  if (role === "admin") return data
  if (!data || typeof data !== "object") return data

  const isEmployee = role === "employee"
  // Managers without a department fall back to self-scope (a promoted account
  // with no department must not inherit full workspace visibility). Employees
  // are always self-scoped.
  const selfScoped = isEmployee || !department
  const identity = { id: userId, email: userEmail, name: userName }
  const isOwn = (row: object): boolean =>
    isOwnRecord(row as Record<string, unknown>, identity, {
      // Directory rows carry their own `id`; a display name is never identity.
      allowNameFallback: key !== "employees",
    })

  // Admin-only modules: non-admins get a genuinely empty structure — except
  // organization, where the workspace name stays visible (it labels the
  // settings panel for everyone; departments etc. stay admin-only).
  if (ADMIN_ONLY_KEYS.has(key)) {
    if (key === "organization") {
      const org = data as { companyName?: string }
      return { companyName: org.companyName ?? "", departments: [], offices: [], orgChart: [] }
    }
    return emptyFor(key)
  }

  switch (key) {
    case "employees": {
      const items = data as Array<{ name?: string; email?: string; department?: string }>
      if (selfScoped) {
        return items.filter((e) => isOwn(e))
      }
      // Manager: filter to their department.
      return items.filter((e) => e.department === department)
    }

    case "leave": {
      const store = data as {
        requests: Array<{ employeeName?: string; employeeId?: string }>
        balances: Record<string, unknown>
      }
      if (selfScoped) {
        return {
          ...store,
          requests: store.requests.filter((r) => isOwn(r)),
          balances: store.balances[userId]
            ? { [userId]: store.balances[userId] }
            : { [userId]: defaultBalances },
        }
      }
      // Manager: only see requests they're allowed to act on (their department).
      return {
        ...store,
        requests: store.requests.filter(
          (r) => {
            // Leave rows carry the account id, while directory rows may be
            // keyed by an e-* id or only by name. Try both.
            const byId = managerDeptOf?.(String(r.employeeId ?? ""))
            const byName = managerDeptOf?.(String(r.employeeName ?? ""))
            return (byId ?? byName) === department
          },
        ),
      }
    }

    case "attendance": {
      const store = data as { checkIns: Array<{ name?: string; dept?: string }> }
      if (selfScoped) {
        return { checkIns: store.checkIns.filter((c) => isOwn(c)) }
      }
      return { checkIns: store.checkIns.filter((c) => c.dept === department) }
    }

    case "projects": {
      const store = data as { tasks: Array<{ ownerName?: string; department?: string }> }
      if (selfScoped) {
        return { tasks: store.tasks.filter((t) => isOwn(t)) }
      }
      return { tasks: store.tasks.filter((t) => t.department === department) }
    }

    case "goals": {
      const store = data as { objectives: Array<{ ownerName?: string }> }
      if (isEmployee || role === "manager") {
        return { objectives: store.objectives.filter((o) => isOwn(o)) }
      }
      return data
    }

    case "performance": {
      const store = data as {
        reviews: Array<{ name?: string; department?: string }>
        teamScores: Array<{ team?: string }>
      }
      if (selfScoped) {
        return { ...store, reviews: store.reviews.filter((r) => isOwn(r)), teamScores: [] }
      }
      // Managers see their department's reviews AND only their own team's
      // leaderboard row — otherwise the spotlight mixes dept-filtered reviews
      // with company-wide team scores.
      return {
        ...store,
        reviews: store.reviews.filter((r) => r.department === department),
        teamScores: store.teamScores.filter((t) => t.team === department),
      }
    }

    case "onboarding": {
      const store = data as { tasks: Array<{ hireName?: string; hireDept?: string }> }
      if (selfScoped) {
        return { tasks: store.tasks.filter((t) => isOwn(t)) }
      }
      return { tasks: store.tasks.filter((t) => t.hireDept === department) }
    }

    case "payslips": {
      // Salary is private: an employee may only ever read their own slips.
      // Managers do NOT get department-wide access to payslips.
      const store = data as { payslips?: Array<Record<string, unknown>> }
      return {
        payslips: (store.payslips ?? []).filter((p) => isOwn(p)),
      }
    }

    case "announcements": {
      // Audience targeting is enforced here, not just in the composer UI:
      // non-admins see company-wide notices plus ones addressed to their
      // own department. Admins see everything.
      const store = data as { announcements?: Array<{ audience?: string }> }
      return {
        announcements: (store.announcements ?? []).filter(
          (a) => !a.audience || a.audience === "all" || a.audience === department,
        ),
      }
    }

    default:
      return data
  }
}

// GET /api/store/[key] — returns the module's JSON document.
// Shared modules are workspace-scoped + role-filtered; personal modules are per-user.
// Seed-on-read uses upsert so concurrent cold starts can't race to a 500.
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { key } = await params
  if (!isKnownKey(key)) {
    return NextResponse.json({ error: "Unknown module." }, { status: 404 })
  }

  const scopeId = scopeFor(key, session.user.id)

  // Analytics is derived live from the workspace's real module documents —
  // there is no stored snapshot to read.
  if (key === "analytics") {
    if (session.user.role !== "admin") {
      return NextResponse.json(emptyFor("analytics"), {
        headers: { "Cache-Control": "no-store" },
      })
    }
    const read = async <T>(k: string): Promise<T> => {
      const doc = await prisma.moduleState.findUnique({
        where: { userId_key: { userId: WORKSPACE_ID, key: k } },
      })
      return (doc?.data as T) ?? (MODULE_DEFAULTS[k] as T)
    }
    const [empData, leaveData, recData] = await Promise.all([
      read<Employee[]>("employees"),
      read<LeaveStore>("leave"),
      read<RecruitmentStore>("recruitment"),
    ])
    const computed = computeAnalytics({
      employees: empData,
      leave: leaveData,
      recruitment: recData,
    })
    return NextResponse.json(computed, {
      headers: {
        "X-Module-Version": String(Date.now()),
        "Cache-Control": "no-store",
      },
    })
  }

  const defaults = MODULE_DEFAULTS[key] as object
  const seeded =
    key === "settings"
      ? {
          ...(defaults as Record<string, unknown>),
          personal: {
            ...(defaults as { personal: Record<string, unknown> }).personal,
            // Fall back to schema-valid placeholders when the session lacks a
            // name (some OAuth accounts) — an empty string would make the
            // document permanently unwritable.
            fullName: session.user.name ?? "Team Member",
            email: session.user.email ?? "user@example.com",
            department: session.user.department ?? "",
          },
        }
      : defaults

  const doc = await prisma.moduleState.upsert({
    where: { userId_key: { userId: scopeId, key } },
    create: { userId: scopeId, key, data: seeded },
    update: {},
  })

  // Ensure the signed-in user has their own row in the shared directory.
  // Real accounts (vs seeded demo people) otherwise have no Employee row, which
  // breaks self-serve dropdowns, manager dept resolution, and cross-module
  // links (leave requests carry employeeId = user.id).
  if (key === "employees" && session.user.role !== "admin") {
    const rows = doc.data as Array<Record<string, unknown> & { id?: string; name?: string; email?: string; department?: string }>
    const idx = rows.findIndex(
      (r) =>
        r.id === session.user.id ||
        (!!session.user.email && r.email === session.user.email),
    )
    let updated = false
    if (idx === -1) {
      const initials =
        (session.user.name ?? "")
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "ME"
      rows.unshift({
        id: session.user.id,
        name: session.user.name ?? "Team Member",
        email: session.user.email ?? "",
        initials,
        department: (DEPARTMENTS as readonly string[]).includes(session.user.department ?? "") ? (session.user.department ?? "People") : "People",
        role: "Team Member",
        location: "Remote",
        status: "active",
        // Absolute date so tenure advances with real time (hiredDaysAgo would
        // stay at 0 forever and silently corrupt every tenure metric).
        hiredAt: new Date().toISOString().slice(0, 10),
        hiredDaysAgo: 0,
      })
      updated = true
    } else if (session.user.department && rows[idx].department !== session.user.department) {
      // Keep the directory row in sync with the real account's department.
      rows[idx] = { ...rows[idx], department: session.user.department }
      updated = true
    }
    if (updated) {
      // Serve the locally merged view so the caller always sees their own row.
      // Persist it with a compare-and-swap on the version we read so a
      // concurrent admin write can't be clobbered; if we lose the race the
      // next read reconciles instead.
      await prisma.moduleState.updateMany({
        where: { userId: scopeId, key, updatedAt: doc.updatedAt },
        data: { data: rows as unknown as Prisma.InputJsonValue },
      })
      doc.data = rows as unknown as Prisma.JsonValue
    }
  }

  // Give every user a personal leave balance on first read so the leave module
  // works for real accounts, not just the seeded demo user.
  let dataToFilter: unknown = doc.data
  if (key === "leave") {
    const store = doc.data as { balances?: Record<string, unknown> }
    if (!store.balances || !store.balances[session.user.id]) {
      const updatedStore = {
        ...store,
        balances: { ...(store.balances ?? {}), [session.user.id]: defaultBalances },
      }
      dataToFilter = updatedStore
      // Persist the balance so cross-module reads (analytics, etc.) can see it
      try {
        await prisma.moduleState.updateMany({
          where: { userId: scopeId, key, updatedAt: doc.updatedAt },
          data: { data: updatedStore as unknown as Prisma.InputJsonValue },
        })
        doc.data = updatedStore as unknown as Prisma.JsonValue
      } catch {
        // Best effort — if CAS fails, another write won; the balance will be
        // seeded on the next read.
      }
    }
  }

  // Resolver that maps an employee name to their department (for manager-scoped
  // leave views). Loaded from the workspace employees document.
  let deptOf: ((name: string) => string | null) | undefined
  let managerBalanceIds: Set<string> | undefined
  if (key === "leave" && session.user.role === "manager") {
    const [empDoc, leaveDoc] = await Promise.all([
      prisma.moduleState.findUnique({
        where: { userId_key: { userId: WORKSPACE_ID, key: "employees" } },
      }),
      prisma.moduleState.findUnique({
        where: { userId_key: { userId: WORKSPACE_ID, key: "leave" } },
      }),
    ])
    const employees = (empDoc?.data as Array<{ id?: string; name?: string; department?: string }>) ?? []
    // Key by id first: two employees can share a display name, but only one
    // account id identifies the requester unambiguously.
    const map = new Map<string, string | null>()
    for (const e of employees) {
      if (e.id) map.set(e.id, e.department ?? null)
      if (e.name) map.set(e.name, e.department ?? null)
    }
    deptOf = (key) => map.get(key) ?? null
    if (session.user.department) {
      // Balances are keyed by employee/user id. A manager may see only their
      // department's balances (needed to act on dept requests) plus their own —
      // never the whole workspace's.
      managerBalanceIds = new Set<string>([session.user.id])
      for (const e of employees) {
        if (e.department === session.user.department && e.id) managerBalanceIds.add(e.id)
      }
      // Leave requests are keyed by the account id, while directory rows use
      // e-* ids. Include the account ids of this department's requesters so a
      // manager can see (and act on) the balances those requests consume.
      const requests =
        (leaveDoc?.data as { requests?: Array<{ employeeId?: string; employeeName?: string }> })?.requests ?? []
      for (const r of requests) {
        if (!r.employeeId) continue
        if (map.get(r.employeeId) === session.user.department || map.get(r.employeeName ?? "") === session.user.department) {
          managerBalanceIds.add(r.employeeId)
        }
      }
    }
  }

  let filtered = filterForRole(
    key,
    dataToFilter,
    session.user.role,
    session.user.department,
    session.user.name ?? null,
    session.user.email ?? null,
    session.user.id,
    deptOf,
  )

  if (key === "leave" && managerBalanceIds) {
    const store = filtered as { balances?: Record<string, unknown> }
    filtered = {
      ...store,
      balances: Object.fromEntries(
        Object.entries(store.balances ?? {}).filter(([id]) => managerBalanceIds!.has(id)),
      ),
    }
  }

  // Employees on leave: the approval flow sets status="leave" but nothing ever
  // flipped it back when the leave expired or was cancelled. Derive the flag
  // from live approved requests on every read instead of trusting a stored
  // value that can never age out.
  if (key === "employees") {
    filtered = await reconcileEmployeeStatuses(filtered)
  }

  // Seed-on-read CAS writes above advanced the row's version. Re-read it so the
  // client doesn't put with a stale version and get a spurious 409.
  const freshDoc = await prisma.moduleState.findUnique({
    where: { userId_key: { userId: scopeId, key } },
    select: { updatedAt: true },
  })
  const responseVersion = (freshDoc?.updatedAt ?? doc.updatedAt).getTime().toString()

  // Organization: reconcile live headcount/team/open counts from the actual
  // employees and recruitment documents so they never drift from the data.
  if (key === "organization" && session.user.role === "admin") {
    return NextResponse.json(await reconcileOrganization(filtered), {
      headers: {
        "X-Module-Version": responseVersion,
        "Cache-Control": "no-store",
      },
    })
  }

  return NextResponse.json(filtered, {
    headers: {
      "X-Module-Version": doc.updatedAt.getTime().toString(),
      "Cache-Control": "no-store",
    },
  })
}

/**
 * An employee is "on leave" only while an approved request covers today. This
 * makes an expired leave window (or a cancellation) restore "active" without
 * a scheduler, and keeps the stored document free of a stale status.
 */
async function reconcileEmployeeStatuses(data: unknown): Promise<unknown> {
  if (!Array.isArray(data)) return data
  const [leaveDoc] = await Promise.all([
    prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key: "leave" } },
    }),
  ])
  const requests = (leaveDoc?.data as { requests?: Array<Record<string, unknown>> })?.requests ?? []
  const today = new Date().toISOString().slice(0, 10)
  const onLeave = new Set<string>()
  for (const r of requests) {
    if (r.status !== "approved") continue
    const start = String(r.startDate ?? "")
    const end = String(r.endDate ?? "")
    if (!start || !end || start > today || today > end) continue
    if (r.employeeId) onLeave.add(String(r.employeeId))
    if (r.employeeName) onLeave.add(`name:${r.employeeName}`)
  }
  return data.map((e) => {
    const row = e as Record<string, unknown>
    const patch: Record<string, unknown> = {}

    // Derive the flag in BOTH directions. Leave requests carry the account id
    // while directory rows use e-* ids, so also match by display name.
    const active = onLeave.has(String(row.id)) || onLeave.has(`name:${row.name}`)
    if (active && row.status !== "inactive") patch.status = "leave"
    else if (row.status === "leave") patch.status = "active"

    // Keep the legacy relative field in sync with the absolute hire date.
    // Every consumer (KPI strips, charts, assistant context) reads
    // hiredDaysAgo, so deriving it here fixes all of them at the source.
    if (typeof row.hiredAt === "string") {
      const hired = new Date(`${row.hiredAt}T00:00:00`)
      if (!Number.isNaN(hired.getTime())) {
        const days = Math.max(0, Math.floor((Date.now() - hired.getTime()) / 86_400_000))
        if (days !== row.hiredDaysAgo) patch.hiredDaysAgo = days
      }
    }

    return Object.keys(patch).length > 0 ? { ...row, ...patch } : row
  })
}

type OrganizationDoc = {
  departments?: Array<Record<string, unknown> & { id?: string; name?: string }>
  offices?: unknown[]
  orgChart?: unknown[]
}

/** Overlay live counts onto the stored department rows. */
async function reconcileOrganization(doc: unknown): Promise<unknown> {
  const org = doc as OrganizationDoc
  const [empDoc, recDoc] = await Promise.all([
    prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key: "employees" } },
    }),
    prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key: "recruitment" } },
    }),
  ])
  const employees = (empDoc?.data as Array<{ department?: string; role?: string; status?: string }>) ?? []
  const openings = (recDoc?.data as { openings?: Array<{ department?: string }> })?.openings ?? []

  const byDept = new Map<string, { people: number; teams: Set<string>; open: number }>()
  for (const e of employees) {
    if (e.status === "inactive") continue
    const key = e.department ?? ""
    const entry = byDept.get(key) ?? { people: 0, teams: new Set<string>(), open: 0 }
    entry.people += 1
    if (e.role) entry.teams.add(e.role)
    byDept.set(key, entry)
  }
  for (const o of openings) {
    const key = o.department ?? ""
    const entry = byDept.get(key) ?? { people: 0, teams: new Set<string>(), open: 0 }
    entry.open += 1
    byDept.set(key, entry)
  }

  const stored = org.departments ?? []
  const departments: Array<Record<string, unknown>> = stored.map((d) => {
    const live = byDept.get(d.name ?? d.id ?? "")
    return {
      ...d,
      // Always overlay live counts so no stored department can drift from the
      // actual employees/openings documents (0 when there's no live data).
      people: live?.people ?? 0,
      teams: live?.teams.size ?? 0,
      open: live?.open ?? 0,
    }
  })

  // A workspace with employees but no saved department rows would otherwise
  // show "0 people" in Organization while Dashboard/Analytics show the real
  // headcount. Synthesize rows for departments implied by live data.
  const named = new Set(stored.map((d) => d.name))
  for (const [name, live] of byDept) {
    if (!name || named.has(name)) continue
    departments.push({
      id: `dept-${name.toLowerCase().replace(/\s+/g, "-")}`,
      code: name.slice(0, 3).toUpperCase(),
      name,
      sub: "Derived from the directory",
      people: live.people,
      teams: live.teams.size,
      open: live.open,
      leadInit: "",
      leadName: "",
      leadRole: "",
      iconBg: "bg-muted",
      iconText: "text-primary",
    })
  }

  return { ...org, departments }
}

// PUT /api/store/[key] — replaces the module's JSON document.
// Validates the body against the module's zod schema. Personal modules are
// writable by the owner; shared modules require admin. Supports optimistic
// concurrency via If-Match (the X-Module-Version from the last GET).
export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { key } = await params
  if (!isKnownKey(key)) {
    return NextResponse.json({ error: "Unknown module." }, { status: 404 })
  }

  // Only admins can write to shared/workspace modules. Personal modules
  // (settings, assistant) are writable by the owner. Non-admins may write to a
  // restricted set of shared modules, but only through a server-side merge that
  // limits changes to their own records (or their department, for managers) —
  // never a wholesale replace. See mergeNonAdminWrite.
  const NON_ADMIN_WRITABLE = new Set([
    "employees", "leave", "projects", "goals", "performance", "onboarding", "attendance",
  ])
  if (
    SHARED_KEYS.has(key) &&
    session.user.role !== "admin" &&
    !NON_ADMIN_WRITABLE.has(key)
  ) {
    return NextResponse.json({ error: "Only admins can modify shared data." }, { status: 403 })
  }

  // Analytics is derived live from the other workspace documents — there is no
  // stored snapshot to write, so saves are rejected outright instead of
  // creating a stale document that no read would ever return. (Checked after
  // the role gate so unauthorized callers still get 403, not 400.)
  if (key === "analytics") {
    return NextResponse.json(
      { error: "Analytics is computed automatically and can't be saved." },
      { status: 400 },
    )
  }

  const body = await request.json().catch(() => null)
  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 })
  }

  // Validate the document shape for this module.
  const schema = STORE_SCHEMAS[key]
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid module data." }, { status: 400 })
  }

  const scopeId = scopeFor(key, session.user.id)

  // Optimistic concurrency: the client sends If-Match with the version it last
  // saw. Both write paths below finish with an atomic compare-and-swap on that
  // version, so two tabs can't both pass a stale check and silently overwrite
  // each other (last write wins only with an unambiguous version chain).
  const ifMatch = request.headers.get("if-match")
  const expected = ifMatch !== null ? Number(ifMatch) : null
  if (ifMatch !== null && !Number.isFinite(expected)) {
    return NextResponse.json(
      { error: "This data changed elsewhere. Refresh to see the latest." },
      { status: 409 },
    )
  }

  // Non-admins go through a restricted server-side merge.
  if (SHARED_KEYS.has(key) && session.user.role !== "admin") {
    return handleNonAdminWrite(key, scopeId, parsed.data, {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      department: session.user.department ?? null,
      role: session.user.role,
    }, expected)
  }

  if (expected !== null) {
    // Atomic compare-and-swap: the replace only lands if the row still carries
    // the version the client saw. count === 0 means another writer got between
    // the client's read and this write.
    const existing = await prisma.moduleState.findUnique({
      where: { userId_key: { userId: scopeId, key } },
      select: { updatedAt: true, data: true },
    })
    const swapped = await prisma.moduleState.updateMany({
      where: { userId: scopeId, key, updatedAt: new Date(expected) },
      data: { data: parsed.data as unknown as Prisma.InputJsonValue },
    })
    if (swapped.count === 0) {
      return NextResponse.json(
        { error: "This data changed elsewhere. Refresh to see the latest." },
        { status: 409 },
      )
    }
    if (key === "leave" && existing) {
      await notifyLeaveChanges({
        stored: existing.data,
        merged: parsed.data,
        actorId: session.user.id,
        actorName: session.user.name ?? "",
      })
    }
    const fresh = await prisma.moduleState.findUnique({
      where: { userId_key: { userId: scopeId, key } },
    })
    await trackWrite(key, existing?.data ?? null, fresh?.data ?? parsed.data, {
      id: session.user.id,
      name: session.user.name ?? null,
      department: session.user.department ?? null,
      role: session.user.role,
    })
    return NextResponse.json(fresh?.data ?? parsed.data, {
      headers: { "X-Module-Version": fresh!.updatedAt.getTime().toString() },
    })
  }

  // No If-Match: read any prior document so notifications and the activity log
  // can diff the change, then upsert.
  const prior = await prisma.moduleState.findUnique({
    where: { userId_key: { userId: scopeId, key } },
    select: { data: true },
  })
  const doc = await prisma.moduleState.upsert({
    where: { userId_key: { userId: scopeId, key } },
    create: { userId: scopeId, key, data: parsed.data as unknown as Prisma.InputJsonValue },
    update: { data: parsed.data as unknown as Prisma.InputJsonValue },
  })
  if (key === "leave" && prior) {
    await notifyLeaveChanges({
      stored: prior.data,
      merged: doc.data,
      actorId: session.user.id,
      actorName: session.user.name ?? "",
    })
  }

  await trackWrite(key, prior?.data ?? null, doc.data, {
    id: session.user.id,
    name: session.user.name ?? null,
    department: session.user.department ?? null,
    role: session.user.role,
  })

  return NextResponse.json(doc.data, {
    headers: { "X-Module-Version": doc.updatedAt.getTime().toString() },
  })
}

/**
 * Non-admin PUT: load the current doc, run the module's restricted merge, and
 * persist only the accepted subset of changes.
 */
/**
 * A non-admin PUT must never answer with the full workspace document — GET
 * filters it for a reason. Reapply the same role filter to the write response.
 */
function filterWriteResponse(
  key: string,
  data: unknown,
  user: { id: string; name: string | null; email: string | null; department: string | null; role: string },
  deptOf: (key: string) => string | null,
): unknown {
  return filterForRole(
    key, data, user.role, user.department, user.name, user.email, user.id, deptOf,
  )
}

async function handleNonAdminWrite(
  key: string,
  scopeId: string,
  incoming: unknown,
  sessionUser: {
    id: string
    name: string | null
    email: string | null
    department: string | null
    role: string
  },
  expectedVersion: number | null,
) {
  const existing = await prisma.moduleState.findUnique({
    where: { userId_key: { userId: scopeId, key } },
  })
  if (!existing) {
    return NextResponse.json(
      { error: "This data isn't ready yet. Refresh and try again." },
      { status: 409 },
    )
  }

  // Department resolver (for leave: which department owns a given requester).
  const empDoc = await prisma.moduleState.findUnique({
    where: { userId_key: { userId: WORKSPACE_ID, key: "employees" } },
  })
  const employees = (empDoc?.data as Array<{ id?: string; name?: string; department?: string }>) ?? []
  // A single key→department map: id wins over display name, so duplicate
  // employee names can no longer widen a manager's scope.
  const deptByKey = new Map<string, string | null>()
  for (const e of employees) {
    if (e.id) deptByKey.set(e.id, e.department ?? null)
    if (e.name) deptByKey.set(e.name, e.department ?? null)
  }
  const deptOf = (key: string) => deptByKey.get(key) ?? null
  const deptOfId = (id: string) => deptByKey.get(id) ?? null

  const ctx: UserCtx = {
    id: sessionUser.id,
    name: sessionUser.name ?? "",
    email: sessionUser.email,
    department: sessionUser.department,
    role: sessionUser.role as UserCtx["role"],
  }

  const merged = mergeNonAdminWrite(key, incoming, existing.data, ctx, deptOf, deptOfId)
  if (!merged.ok) {
    return NextResponse.json({ error: merged.error }, { status: 403 })
  }

  if (expectedVersion !== null) {
    if (existing.updatedAt.getTime() !== expectedVersion) {
      return NextResponse.json(
        { error: "This data changed elsewhere. Refresh to see the latest." },
        { status: 409 },
      )
    }
    // Atomic compare-and-swap so a merge computed from a stale read can never
    // land on top of a newer write.
    const swapped = await prisma.moduleState.updateMany({
      where: { userId: scopeId, key, updatedAt: existing.updatedAt },
      data: { data: merged.data as unknown as Prisma.InputJsonValue },
    })
    if (swapped.count === 0) {
      return NextResponse.json(
        { error: "This data changed elsewhere. Refresh to see the latest." },
        { status: 409 },
      )
    }
    if (key === "leave") {
      await notifyLeaveChanges({
        stored: existing.data,
        merged: merged.data,
        actorId: sessionUser.id,
        actorName: sessionUser.name ?? "",
      })
    }
    const fresh = await prisma.moduleState.findUnique({
      where: { userId_key: { userId: scopeId, key } },
    })
    await trackWrite(key, existing.data, fresh?.data ?? merged.data, sessionUser)
    return NextResponse.json(
      filterWriteResponse(key, fresh?.data ?? merged.data, sessionUser, deptOf),
      { headers: { "X-Module-Version": fresh!.updatedAt.getTime().toString() } },
    )
  }

  const doc = await prisma.moduleState.update({
    where: { userId_key: { userId: scopeId, key } },
    data: { data: merged.data as object },
  })

  if (key === "leave") {
    await notifyLeaveChanges({
      stored: existing.data,
      merged: doc.data,
      actorId: sessionUser.id,
      actorName: sessionUser.name ?? "",
    })
  }

  await trackWrite(key, existing.data, doc.data, sessionUser)

  return NextResponse.json(
    filterWriteResponse(key, doc.data, sessionUser, deptOf),
    { headers: { "X-Module-Version": doc.updatedAt.getTime().toString() } },
  )
}
