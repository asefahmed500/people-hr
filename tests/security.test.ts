import assert from "node:assert/strict"
import { test } from "node:test"

import { hashBackupCode, generateBackupCodes } from "../lib/totp"
import { isOwnRecord } from "../lib/role-scope"
import { toCsv } from "../lib/export"

test("backup codes are unpredictable, unique and stored as digests", () => {
  const codes = generateBackupCodes(12)
  assert.equal(codes.length, 12)
  assert.equal(new Set(codes).size, 12)
  assert.match(codes[0], /^[A-HJ-NP-Z2-9]{8}$/)
  assert.notEqual(hashBackupCode(codes[0]), codes[0])
  assert.match(hashBackupCode(codes[0]), /^[a-f0-9]{64}$/)
  assert.equal(hashBackupCode(` ${codes[0].toLowerCase()} `), hashBackupCode(codes[0]))
})

test("ownership resolves by owner id, then email, then name only as a last resort", () => {
  const user = { id: "u-1", email: "a@x.co", name: "Alex" }
  // `id` is a record id, not an owner id — never use it to grant access.
  assert.equal(isOwnRecord({ id: "u-1", name: "Someone Else" }, user), false)
  assert.equal(isOwnRecord({ employeeId: "u-1", name: "Someone Else" }, user), true)
  assert.equal(isOwnRecord({ employeeId: "u-2", name: "Alex" }, user), false)
  assert.equal(isOwnRecord({ email: "a@x.co", name: "Someone Else" }, user), true)
  assert.equal(isOwnRecord({ email: "b@x.co" }, user), false)
  assert.equal(isOwnRecord({ ownerName: "Alex" }, user), true)
  assert.equal(isOwnRecord({ name: "Alex" }, { name: "Different" }), false)
})

test("a hire's e-* id is bridged to their login by verified email, never by name", () => {
  const user = { id: "u-123", email: "hire@example.com", name: "Hire Person" }
  // Rows created at hire carry an e-* directory id, not the login account id.
  assert.equal(isOwnRecord({ employeeId: "e-abc", hireEmail: "hire@example.com" }, user), true)
  assert.equal(isOwnRecord({ employeeId: "e-abc", employeeEmail: "HIRE@example.com" }, user), true)
  // A foreign id is never overwritten by a matching display name.
  assert.equal(isOwnRecord({ employeeId: "e-someone-else", hireName: "Hire Person" }, user), false)
  assert.equal(isOwnRecord({ employeeId: "e-someone-else", hireEmail: "other@example.com" }, user), false)
})

test("CSV export neutralises spreadsheet formula injection", () => {
  const csv = toCsv([{ label: "=HYPERLINK(\"http://evil\")" }], [{ key: "label", label: "Name" }])
  assert.match(csv, /"'=HYPERLINK/)
  assert.doesNotMatch(csv.split("\n")[1], /^=HYPERLINK/)
})
