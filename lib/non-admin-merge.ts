// Server-side merge rules that let non-admin users make a restricted set of
// changes to shared workspace documents WITHOUT being able to replace the whole
// document.
//
// KEY INVARIANT: non-admin clients only ever SEE a role-filtered slice of the
// document (own records for employees, department records for managers), and
// they PUT that slice back. The merge therefore treats the incoming arrays as
// "the user's scope, replaced" — rows OUTSIDE the user's scope are preserved
// from the stored document untouched, and rows INSIDE the scope are validated
// (added/changed rows must be owned by the writer).

import { isOwnRecord } from "@/lib/role-scope"

export type UserCtx = {
  id: string
  name: string
  email: string | null
  department: string | null
  role: "admin" | "manager" | "employee"
}

type Row = Record<string, unknown>

const isManager = (ctx: UserCtx) => ctx.role === "manager"
const isAdmin = (ctx: UserCtx) => ctx.role === "admin"
const isEmployee = (ctx: UserCtx) => ctx.role === "employee"

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false
  const aArr = Array.isArray(a)
  const bArr = Array.isArray(b)
  if (aArr !== bArr) return false
  if (aArr && bArr) {
    const al = a as unknown[]
    const bl = b as unknown[]
    return al.length === bl.length && al.every((x, i) => deepEqual(x, bl[i]))
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const keys = Object.keys(ao)
  return keys.length === Object.keys(bo).length && keys.every((k) => deepEqual(ao[k], bo[k]))
}

// ---------------------------------------------------------------------------
// Module configs: how to resolve a row's owner + department, mirroring the
// read-side filterForRole scoping.
// ---------------------------------------------------------------------------

type ArrayModuleConfig = {
  arrayKey: string
  nameFields: string[]
  deptField?: string
  emailField?: string
  idField?: string
  /** Roles for which the module is strictly read-only via the merge. */
  readOnlyFor?: ArrayModuleRole[]
}

type ArrayModuleRole = "admin" | "manager" | "employee"

const ARRAY_MODULES: Record<string, ArrayModuleConfig> = {
  projects: { arrayKey: "tasks", nameFields: ["ownerName"], deptField: "department" },
  goals: { arrayKey: "objectives", nameFields: ["ownerName"] },
  performance: {
    arrayKey: "reviews",
    nameFields: ["name"],
    deptField: "department",
    // Reviews are written by managers/admins ABOUT people. Employees get a
    // read-only view; letting them add/change/delete their own review rows
    // would let them self-assign ratings or erase feedback.
    readOnlyFor: ["employee"],
  },
  // Employees have a read-only onboarding view (and are redirected away from
  // the page); reject their writes to the module as well.
  onboarding: { arrayKey: "tasks", nameFields: ["hireName"], deptField: "hireDept", readOnlyFor: ["employee"] },
  // Check-ins are verified by face. Employees must not be able to write
  // arbitrary self-reported rows through the generic store API.
  attendance: { arrayKey: "checkIns", nameFields: ["name"], deptField: "dept", readOnlyFor: ["employee"] },
}

/** True when a stored/incoming row is inside the user's read scope. */
function inScope(row: Row, config: ArrayModuleConfig, ctx: UserCtx): boolean {
  if (isOwnRecord(row, { id: ctx.id, email: ctx.email, name: ctx.name })) return true
  if (isManager(ctx) && config.deptField && ctx.department) {
    return String(row[config.deptField] ?? "") === ctx.department
  }
  return false
}

function mergeArrayModule(
  key: string,
  incoming: unknown,
  stored: unknown,
  ctx: UserCtx,
): { ok: true; data: object } | { ok: false; error: string } {
  const config = ARRAY_MODULES[key]
  const incomingObj = (incoming ?? {}) as Record<string, unknown>
  const storedObj = (stored ?? {}) as Record<string, unknown>

  // Scalar keys outside the owned array (e.g. teamScores) are always taken
  // from the stored document — non-admin writers can never change them, even
  // when their role-filtered read view shows a redacted value.

  const storedArr = (storedObj[config.arrayKey] ?? []) as Row[]
  const incomingArr = (incomingObj[config.arrayKey] ?? []) as Row[]

  const byId = (a: Row[]) => new Map(a.map((r) => [String(r.id), r]))
  const s = byId(storedArr)
  const i = byId(incomingArr)

  // Read-only modules for this role: any add/change/removal is rejected.
  if (config.readOnlyFor?.includes(ctx.role)) {
    const hasChanges =
      i.size !== s.size ||
      [...i.entries()].some(([id, row]) => {
        const prev = s.get(id)
        return !prev || !deepEqual(prev, row)
      })
    if (hasChanges) {
      return { ok: false, error: "Reviews are managed by managers and admins." }
    }
  }

  // Added and changed rows must be owned (inside the writer's scope). Deleted
  // rows need no separate check: the client only ever saw its own slice, so
  // anything it removed was in scope by definition — see the rebuild below.
  for (const [id, row] of i) {
    const prev = s.get(id)
    const added = !prev
    const changed = prev && !deepEqual(prev, row)
    if ((added || changed) && !inScope(row, config, ctx)) {
      return { ok: false, error: "You can only change your own records." }
    }
    // A manager's NEW rows must be in their own department. inScope() matches
    // on owner name first, so a crafted row could otherwise claim someone
    // else's department while still passing the ownership check.
    if (added && isManager(ctx) && ctx.department && config.deptField) {
      if (String(row[config.deptField] ?? "") !== ctx.department) {
        return { ok: false, error: "You can only create records in your own department." }
      }
    }
    // Prevent non-admins from hijacking rows by changing the dept field
    if (changed && prev && config.deptField && !isAdmin(ctx)) {
      if (String(prev[config.deptField] ?? "") !== String(row[config.deptField] ?? "")) {
        return { ok: false, error: "Department can only be changed by an admin." }
      }
    }
  }

  // Rebuild: preserve out-of-scope stored rows untouched, take the incoming
  // slice for everything else.
  const preserved = storedArr.filter((row) => !inScope(row, config, ctx))
  // The caller's filtered view can echo an unchanged out-of-scope row. Keep it
  // once, not once in each half of the rebuild.
  const preservedIds = new Set(preserved.map((r) => String(r.id)))
  const effective = [...preserved, ...incomingArr.filter((r) => !preservedIds.has(String(r.id)))]

  // Nothing else in the doc may change.
  const merged = { ...storedObj, [config.arrayKey]: effective } as object

  return { ok: true, data: merged }
}

// ---------------------------------------------------------------------------
// Employees: the doc is a top-level array.
// ---------------------------------------------------------------------------

const EMPLOYEES_CONFIG: ArrayModuleConfig = {
  arrayKey: "",
  nameFields: ["name"],
  deptField: "department",
  emailField: "email",
  idField: "id",
}

/** True when none of the given identity fields changed between rows. */
function identityUnchanged(prev: Row, row: Row, fields: string[]): boolean {
  return fields.every((f) => String(prev[f] ?? "") === String(row[f] ?? ""))
}

function mergeEmployees(
  incoming: unknown,
  stored: unknown,
  ctx: UserCtx,
): { ok: true; data: object } | { ok: false; error: string } {
  const storedArr = (Array.isArray(stored) ? stored : []) as Row[]
  const incomingArr = (Array.isArray(incoming) ? incoming : []) as Row[]
  const cfg = EMPLOYEES_CONFIG

  const s = new Map(storedArr.map((r) => [String(r.id), r]))
  const i = new Map(incomingArr.map((r) => [String(r.id), r]))

  // Added and changed rows must be owned; deletions are checked explicitly
  // below (directory removal is an admin-only operation).
  for (const [id, row] of i) {
    const prev = s.get(id)
    const added = !prev
    const changed = prev && !deepEqual(prev, row)
    if ((added || changed) && !inScope(row, cfg, ctx)) {
      return { ok: false, error: "You can only change your own records." }
    }
    // Identity fields route scope matching everywhere else (read filters,
    // manager dept resolution, leave ownership). Changing them would let a
    // writer impersonate another row's owner (e.g. copying someone's email
    // onto their own row pulls that row into their editable slice), so
    // they're immutable outside admin writes.
    if (changed && prev && !identityUnchanged(prev, row, ["id", "email", "department"])) {
      return {
        ok: false,
        error: "Id, email and department can only be changed by an admin.",
      }
    }
    // Payroll/employment fields are privileged. Non-admins have no UI for them;
    // allowing them here would let an employee set their own salary or status.
    if (changed && prev) {
      // `name` is identity for several modules' row scoping — let the User row
      // own it (profile route keeps the directory in sync).
      const privileged = ["salary", "role", "status", "hiredAt", "hiredDaysAgo", "name"]
      if (privileged.some((field) => !deepEqual(prev[field], row[field]))) {
        return {
          ok: false,
          error: "Employment details can only be changed by an admin.",
        }
      }
    }
  }

  // Employees may not create or remove directory rows at all — self-service
  // creation would let them mint rows with chosen emails/ids, and removal
  // would silently drop them from manager scopes. Managers may add rows in
  // their own department (inScope above) but not remove them.
  for (const [id] of i) {
    if (!s.has(id) && ctx.role === "employee") {
      return { ok: false, error: "Contact a manager or admin to be added to the directory." }
    }
  }
  for (const [id, row] of s) {
    if (!i.has(id) && inScope(row, cfg, ctx)) {
      return { ok: false, error: "Only admins can remove people from the directory." }
    }
  }

  const preserved = storedArr.filter((row) => !inScope(row, cfg, ctx))
  const preservedIds = new Set(preserved.map((r) => String(r.id)))
  const effective = [...preserved, ...incomingArr.filter((r) => !preservedIds.has(String(r.id)))]
  return { ok: true, data: effective as unknown as object }
}

// ---------------------------------------------------------------------------
// Leave: employees can add/edit/cancel their own PENDING requests; managers can
// approve/decline requests in their department (and the matching balance
// adjustment). Everyone else's requests and balances are preserved.
// ---------------------------------------------------------------------------

type LeaveDoc = { requests: Row[]; balances: Record<string, unknown> }

type Balances = {
  annual: { used: number; total: number }
  sick: { used: number; total: number }
  personal: { used: number; total: number }
  parental: { used: number; total: number }
}

function mergeLeave(
  incoming: unknown,
  stored: unknown,
  ctx: UserCtx,
  deptOf: (name: string) => string | null,
  deptOfId?: (id: string) => string | null,
): { ok: true; data: object } | { ok: false; error: string } {
  const inc = (incoming ?? {}) as LeaveDoc
  const sto = (stored ?? {}) as LeaveDoc
  const storedArr = sto.requests ?? []
  const incomingArr = inc.requests ?? []

  const isOwn = (r: Row): boolean =>
    isOwnRecord(r, { id: ctx.id, email: ctx.email, name: ctx.name })

  const inLeaveScope = (r: Row): boolean => {
    if (isOwn(r)) return true
    if (isManager(ctx) && ctx.department) {
      return (
        deptOf(String(r.employeeId ?? "")) ?? deptOf(String(r.employeeName ?? ""))
      ) === ctx.department
    }
    return false
  }

  const s = new Map(storedArr.map((r) => [String(r.id), r]))
  const i = new Map(incomingArr.map((r) => [String(r.id), r]))

  // Added: only the user's own pending request, one at a time.
  const added: Row[] = []
  for (const [id, row] of i) if (!s.has(id)) added.push(row)
  for (const r of added) {
    if (r.status !== "pending") return { ok: false, error: "You can only add a pending request." }
    if (!isOwn(r)) return { ok: false, error: "You can only request leave for yourself." }
  }
  if (added.length > 1) return { ok: false, error: "You can only add one request at a time." }

  // Changed: must stay in scope; employees may only edit their own pending.
  for (const [id, row] of i) {
    const prev = s.get(id)
    if (!prev || deepEqual(prev, row)) continue
    if (!inLeaveScope(row)) return { ok: false, error: "You can only change your own requests." }
    // Employees may only ever edit a request that was pending AND remains
    // pending. Checking only the previous status allowed self-approval:
    // pending -> approved passed and inflated the balance.
    if (isEmployee(ctx) && (prev.status !== "pending" || row.status !== "pending")) {
      return { ok: false, error: "You can only edit a pending request." }
    }
    // Ownership fields route dept resolution + balance accounting; changing
    // them on an existing request would re-route someone else's request.
    if (
      String(prev.employeeId ?? "") !== String(row.employeeId ?? "") ||
      String(prev.employeeName ?? "") !== String(row.employeeName ?? "")
    ) {
      return { ok: false, error: "The owner of a leave request can't be changed." }
    }
  }

  // Removed: scoped rows missing from the incoming slice. Non-admins may only
  // cancel PENDING requests — removing an approved one would consume balance
  // days permanently (the server rejects balance decreases, so nobody could
  // ever refund them). Managers must use the admin flow for that.
  for (const [id, row] of s) {
    if (i.has(id) || !inLeaveScope(row)) continue
    if (row.status !== "pending") {
      return { ok: false, error: "You can only cancel a pending request." }
    }
  }

  // Requests: preserve out-of-scope rows, take the incoming slice.
  const preservedRequests = storedArr.filter((r) => !inLeaveScope(r))
  const preservedRequestIds = new Set(preservedRequests.map((r) => String(r.id)))
  const effectiveRequests = [
    ...preservedRequests,
    ...incomingArr.filter((r) => !preservedRequestIds.has(String(r.id))),
  ]

  // --- Server-side business rules for the writer's OWN pending requests ---
  const BUCKET: Record<string, string> = { vac: "annual", sick: "sick", pers: "personal", par: "parental" }
  const daysOf = (r: Row): number => {
    if (r.halfDay === true) return 0.5
    const s = new Date(String(r.startDate ?? "")).getTime()
    const e = new Date(String(r.endDate ?? "")).getTime()
    if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return -1
    return Math.round((e - s) / 86400_000) + 1
  }

  const ownPendingIds = new Set<string>()
  for (const [id, row] of i) {
    if (isOwn(row) && row.status === "pending" && daysOf(row) > 0) ownPendingIds.add(id)
  }

  // No overlapping date ranges for the same person.
  for (const idA of ownPendingIds) {
    const a = i.get(idA)!
    const aStart = String(a.startDate ?? "")
    const aEnd = String(a.endDate ?? "")
    for (const other of effectiveRequests) {
      if (String(other.id) === idA) continue
      if (String(other.employeeId ?? "") !== String(a.employeeId ?? "")) continue
      if (other.status === "declined") continue
      const oStart = String(other.startDate ?? "")
      const oEnd = String(other.endDate ?? "")
      if (!oStart || !oEnd) continue
      if (aStart <= oEnd && oStart <= aEnd) {
        return {
          ok: false,
          error: "You already have a request that overlaps these dates.",
        }
      }
    }
  }

  // Requested days must fit the remaining balance for that leave type.
  for (const idA of ownPendingIds) {
    const a = i.get(idA)!
    const bucket = BUCKET[String(a.type)] as keyof Balances | undefined
    if (!bucket) continue
    const bal = (sto.balances?.[ctx.id] ?? inc.balances?.[ctx.id]) as Balances | undefined
    if (!bal || typeof bal[bucket] !== "object") continue
    // `bal[bucket].used` already has the days of every APPROVED request
    // deducted (that is what approval does). Counting approved requests again
    // here double-charges them and makes any new request look over-budget.
    // Only outstanding PENDING requests are reservations that still need to be
    // held against the remaining balance.
    const usedElsewhere = effectiveRequests
      .filter(
        (r) =>
          String(r.id) !== idA &&
          String(r.employeeId ?? "") === ctx.id &&
          r.status === "pending" &&
          BUCKET[String(r.type)] === bucket,
      )
      .reduce((sum, r) => sum + daysOf(r), 0)
    const remaining = bal[bucket].total - bal[bucket].used - usedElsewhere
    if (daysOf(a) > remaining) {
      return {
        ok: false,
        // Report the actual entitlement remaining (excluding other pending
        // reservations), otherwise a second request in the same write makes
        // the message claim "0 days remaining" despite a full entitlement.
        error: `Not enough ${bucket} balance: ${Math.max(0, bal[bucket].total - bal[bucket].used)} day(s) available${usedElsewhere > 0 ? ` (${usedElsewhere} already reserved in pending requests)` : ""}.`,
      }
    }
  }

  // Balances: start from stored, overlay incoming changes. Incoming is usually
  // the user's filtered view ({ [userId]: own }) so overlaying is safe; changes
  // are validated per key.
  // A balance may only increase by exactly the days of requests that this
  // write transitioned to "approved". Without this cap, a non-admin could set
  // `used` to any value and mint leave entitlement.
  const BUCKET_FOR_TYPE: Record<string, string> = { vac: "annual", sick: "sick", pers: "personal", par: "parental" }
  const approvalDelta = new Map<string, number>()
  for (const row of i.values()) {
    const before = s.get(String(row.id))
    if (row.status !== "approved" || before?.status === "approved") continue
    const bucket = BUCKET_FOR_TYPE[String(row.type)]
    if (!bucket) continue
    const employeeKey = String(row.employeeId ?? "")
    const deltaKey = `${employeeKey}:${bucket}`
    approvalDelta.set(deltaKey, (approvalDelta.get(deltaKey) ?? 0) + daysOf(row))
  }

  const mergedBalances: Record<string, unknown> = { ...(sto.balances ?? {}) }
  for (const [key, value] of Object.entries(inc.balances ?? {})) {
    if (deepEqual(sto.balances?.[key], value)) continue
    const allowed =
      key === ctx.id ||
      (isManager(ctx) &&
        ctx.department != null &&
        ((deptOfId?.(key) ?? "") === ctx.department || // balance for a dept employee
          [...i.values()].some(
            (r) =>
              String(r.employeeId ?? "") === key &&
              (deptOf(String(r.employeeId ?? "")) ?? deptOf(String(r.employeeName ?? ""))) === ctx.department,
          )))
    if (!allowed) return { ok: false, error: "You can only change your own balance." }
    // Non-admins can only change `used`, not `total` (entitlement)
    if (!isAdmin(ctx) && sto.balances?.[key]) {
      const stored = sto.balances[key] as Record<string, { used: number; total: number }>
      const incoming = value as Record<string, { used: number; total: number }>
      const locked: Record<string, { used: number; total: number }> = {}
      for (const bucket of Object.keys(incoming)) {
        const storedUsed = Number(stored[bucket]?.used ?? 0)
        const incomingUsed = Number(incoming[bucket]?.used ?? storedUsed)
        // Consumed days may only go UP via an approval. Accepting an arbitrary
        // client-supplied decrease lets any employee (or a manager editing a
        // department row) erase their used leave and request unlimited days.
        const maxAllowed = storedUsed + (approvalDelta.get(`${key}:${bucket}`) ?? 0)
        if (!Number.isFinite(incomingUsed) || incomingUsed < storedUsed || incomingUsed > maxAllowed) {
          return {
            ok: false,
            error: "Leave balances can only change by approving a request.",
          }
        }
        locked[bucket] = {
          used: incomingUsed,
          total: stored[bucket]?.total ?? incoming[bucket]?.total ?? 0,
        }
      }
      mergedBalances[key] = locked
    } else {
      mergedBalances[key] = value
    }
  }

  return {
    ok: true,
    data: { requests: effectiveRequests, balances: mergedBalances } as object,
  }
}

// ---------------------------------------------------------------------------
// Entry point: called by PUT for non-admins on shared modules.
// ---------------------------------------------------------------------------

export function mergeNonAdminWrite(
  key: string,
  incoming: unknown,
  stored: unknown,
  ctx: UserCtx,
  deptOf: (name: string) => string | null,
  deptOfId?: (id: string) => string | null,
): { ok: true; data: object } | { ok: false; error: string } {
  switch (key) {
    case "employees":
      return mergeEmployees(incoming, stored, ctx)
    case "leave":
      return mergeLeave(incoming, stored, ctx, deptOf, deptOfId)
    case "projects":
    case "goals":
    case "performance":
    case "onboarding":
    case "attendance":
      return mergeArrayModule(key, incoming, stored, ctx)
    default:
      return { ok: false, error: "Only admins can modify this data." }
  }
}

export { isEmployee }
