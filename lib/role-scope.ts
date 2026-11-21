// Client-safe helpers for translating the signed-in user's role into the
// scope boundaries the server enforces on shared module documents. Kept in one
// place so the UI's form restrictions can't drift from the server's merge
// rules (lib/non-admin-merge.ts).

export type RoleUser = {
  role?: string | null
  department?: string | null
} | null | undefined

/**
 * Departments a user may write rows into on shared modules. Managers are
 * restricted to their own department (the server merge rejects rows outside
 * it); admins and employees are unrestricted — employees are scoped by owner
 * name instead.
 */
export function scopeDepartments(user: RoleUser, all: readonly string[]): readonly string[] {
  if (user?.role === "manager" && user.department) return [user.department]
  return all
}

type Identity = {
  id?: string | null
  email?: string | null
  name?: string | null
}

// NOTE: do NOT include the generic `id` field here — on most module rows it is
// the record's own id (e.g. a leave request id), not the owner's account id.
const ID_FIELDS = ["employeeId", "userId", "ownerId"] as const
const NAME_FIELDS = ["name", "employeeName", "ownerName", "hireName", "reviewerName"] as const

/**
 * True when a shared-module row belongs to the signed-in user.
 *
 * Identity is resolved strictly from stable fields first (account/employee
 * id, then email). A display name is only consulted when the row has NO id or
 * email at all — otherwise two people sharing a name would each see and be
 * able to edit the other's records.
 *
 * This is the single source of truth for the store route's read filter and
 * the non-admin write merge; keep both using it.
 */
export function isOwnRecord(
  row: Record<string, unknown>,
  user: Identity,
  options: { allowNameFallback?: boolean } = {},
): boolean {
  // The employees directory is keyed by row `id`, which for real accounts is
  // the account id. Never fall back to a display name there: two people can
  // share a name (and legacy rows may have an empty email), which would leak
  // other people's records.
  if (options.allowNameFallback === false) {
    const rowId = typeof row.id === "string" ? row.id : ""
    if (rowId && !!user.id && rowId === user.id) return true
    const email = typeof row.email === "string" ? row.email.trim().toLowerCase() : ""
    return !!user.email && !!email && email === user.email.trim().toLowerCase()
  }

  const ids = ID_FIELDS.map((field) => row[field]).filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  )
  if (ids.length > 0) return !!user.id && ids.includes(user.id)

  const rowEmail = typeof row.email === "string" ? row.email.trim().toLowerCase() : ""
  if (rowEmail) return !!user.email && rowEmail === user.email.trim().toLowerCase()

  const names = NAME_FIELDS.map((field) => row[field]).filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  )
  return names.length > 0 && !!user.name && names.includes(user.name)
}
