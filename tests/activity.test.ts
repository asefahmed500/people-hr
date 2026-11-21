import assert from "node:assert/strict"
import { test } from "node:test"

import { describeDocumentChange } from "../lib/activity"

test("activity diff reports adds without exposing field values", () => {
  const result = describeDocumentChange(
    "employees",
    [{ id: "e1", name: "Alex", salary: 100 }],
    [
      { id: "e1", name: "Alex", salary: 100 },
      { id: "e2", name: "Sam", salary: 9999 },
    ],
  )
  assert.equal(result.action, "created")
  assert.match(result.summary, /Added 1/)
  assert.doesNotMatch(result.summary, /Sam|9999|Alex|100/)
})

test("activity diff reports updates and removals", () => {
  const before = [{ id: "e1", status: "active" }, { id: "e2", status: "active" }]
  const updated = describeDocumentChange("employees", before, [
    { id: "e1", status: "leave" },
    { id: "e2", status: "active" },
  ])
  assert.equal(updated.action, "updated")
  assert.match(updated.summary, /Updated 1/)

  const deleted = describeDocumentChange("employees", before, [before[0]])
  assert.equal(deleted.action, "deleted")
  assert.match(deleted.summary, /Removed 1/)

  const noop = describeDocumentChange("settings", before, before)
  assert.equal(noop.action, "updated")
  assert.match(noop.summary, /Saved/)
})
