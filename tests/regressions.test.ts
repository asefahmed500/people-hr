import assert from "node:assert/strict"
import { test } from "node:test"

import { isOwnRecord } from "../lib/role-scope"
import { mergeNonAdminWrite } from "../lib/non-admin-merge"

test("REGRESSION: empty-email duplicate names cannot expose another user's directory row", () => {
  const user = { id: "u-1", email: "jordan@real.co", name: "Jordan Lee" }
  const stranger = { id: "e-dup-2", name: "Jordan Lee", email: "", department: "Sales" }

  // Strict mode is used by the employees module. `id` is a directory row id,
  // not an owner id, so neither an empty email nor a matching display name
  // may grant access.
  assert.equal(isOwnRecord(stranger, user, { allowNameFallback: false }), false)
  assert.equal(isOwnRecord({ id: "u-1", name: "Someone Else" }, user, { allowNameFallback: false }), true)
  assert.equal(isOwnRecord({ email: "jordan@real.co" }, user, { allowNameFallback: false }), true)
})

test("REGRESSION: a manager cannot delete an approved leave request (balance would drift)", () => {
  const ctx = {
    id: "mgr-1",
    name: "Manager",
    email: "mgr@x.co",
    department: "Engineering",
    role: "manager" as const,
  }
  const approved = {
    id: "REQ-1",
    employeeId: "emp-1",
    employeeName: "Employee",
    initials: "E",
    type: "vac",
    status: "approved",
    startDate: "2027-03-01",
    endDate: "2027-03-01",
    days: 1,
    reason: "test",
  }
  const stored = {
    requests: [approved],
    balances: { "emp-1": { annual: { used: 1, total: 24 }, sick: { used: 0, total: 25 }, personal: { used: 0, total: 5 }, parental: { used: 0, total: 150 } } },
  }
  const incoming = { requests: [], balances: {} }

  const result = mergeNonAdminWrite("leave", incoming, stored, ctx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, /pending/i)
})

test("REGRESSION: a manager CAN cancel a pending request in their department", () => {
  const ctx = {
    id: "mgr-1",
    name: "Manager",
    email: "mgr@x.co",
    department: "Engineering",
    role: "manager" as const,
  }
  const pending = {
    id: "REQ-2",
    employeeId: "emp-1",
    employeeName: "Employee",
    initials: "E",
    type: "vac",
    status: "pending",
    startDate: "2027-04-01",
    endDate: "2027-04-01",
    days: 1,
    reason: "test",
  }
  const stored = { requests: [pending], balances: {} }
  const result = mergeNonAdminWrite("leave", { requests: [], balances: {} }, stored, ctx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, true)
})

const employeeCtx = {
  id: "emp-1",
  name: "Employee",
  email: "emp@x.co",
  department: "Engineering",
  role: "employee" as const,
}

test("REGRESSION: employee cannot self-approve leave or inflate balance", () => {
  const pending = {
    id: "r1", employeeId: "emp-1", employeeName: "Employee", initials: "E",
    type: "vac", status: "pending", startDate: "2027-01-01", endDate: "2027-01-01",
    days: 1, reason: "test",
  }
  const balances = {
    "emp-1": { annual: { used: 0, total: 24 }, sick: { used: 0, total: 25 }, personal: { used: 0, total: 5 }, parental: { used: 0, total: 150 } },
  }
  const stored = { requests: [pending], balances }
  const approved = { ...pending, status: "approved" }
  const inflated = { ...balances, "emp-1": { ...balances["emp-1"], annual: { used: 10, total: 24 } } }

  const result = mergeNonAdminWrite("leave", { requests: [approved], balances: inflated }, stored, employeeCtx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, false)
})

test("REGRESSION: employee cannot set own salary, role or status", () => {
  const row = {
    id: "e-emp", name: "Employee", email: "emp@x.co", initials: "E",
    department: "Engineering", role: "Engineer", location: "Remote",
    status: "active", hiredDaysAgo: 0, salary: 1000,
  }
  const tampered = { ...row, salary: 999999, role: "admin", status: "inactive" }
  const result = mergeNonAdminWrite("employees", [tampered], [row], employeeCtx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, false)
})

test("REGRESSION: manager cannot create a task in another department", () => {
  const ctx = { ...employeeCtx, id: "mgr-1", name: "Manager", role: "manager" as const }
  const task = {
    id: "p1", name: "X", ownerName: "Manager", ownerInit: "M", department: "Sales",
    progress: 0, dueOrShipped: "x", status: "on-track", tone: "green",
  }
  const result = mergeNonAdminWrite("projects", { tasks: [task] }, { tasks: [] }, ctx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, false)
})

test("REGRESSION: employee cannot write onboarding tasks", () => {
  const task = { id: "o1", hireInit: "E", hireName: "Employee", hireRole: "Eng", hireDept: "Engineering", phase: "w1", done: true, label: "x" }
  const result = mergeNonAdminWrite("onboarding", { tasks: [task] }, { tasks: [] }, employeeCtx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, false)
})

const managerCtx = {
  id: "mgr-1", name: "Manager", email: "mgr@x.co",
  department: "Engineering", role: "manager" as const,
}

test("REGRESSION: a manager cannot mint a new employee row with a salary", () => {
  const added = {
    id: "e-new", name: "New Hire", email: "new@x.co", initials: "N",
    department: "Engineering", role: "Engineer", location: "Remote",
    status: "active", hiredDaysAgo: 0, salary: 9000,
  }
  const result = mergeNonAdminWrite("employees", [added], [], managerCtx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, /compensation/i)
})

test("REGRESSION: a manager cannot approve their own leave request", () => {
  const pending = {
    id: "r-self", employeeId: "mgr-1", employeeName: "Manager", initials: "M",
    type: "vac", status: "pending", startDate: "2027-05-01", endDate: "2027-05-01",
    days: 1, reason: "test",
  }
  const balances = {
    "mgr-1": { annual: { used: 0, total: 24 }, sick: { used: 0, total: 25 }, personal: { used: 0, total: 5 }, parental: { used: 0, total: 150 } },
  }
  const stored = { requests: [pending], balances }
  const incoming = { requests: [{ ...pending, status: "approved" }], balances }
  const result = mergeNonAdminWrite("leave", incoming, stored, managerCtx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, /own leave request/i)
})

test("REGRESSION: an employee cannot create a task in another department", () => {
  const task = {
    id: "p2", name: "X", ownerName: "Employee", ownerInit: "E", department: "Sales",
    progress: 0, dueOrShipped: "x", status: "on-track", tone: "green",
  }
  const result = mergeNonAdminWrite("projects", { tasks: [task] }, { tasks: [] }, employeeCtx, () => "Engineering", () => "Engineering")
  assert.equal(result.ok, false)
})
