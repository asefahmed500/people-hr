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
