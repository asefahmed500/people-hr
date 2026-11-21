import assert from "node:assert/strict"
import { test } from "node:test"

import { nextRefNo, companyRefCode, type HRDocument } from "../lib/data/documents"
import { adjustBalance, defaultBalances, type LeaveRequest } from "../lib/data/leave"
import { toCsv } from "../lib/export"

function doc(refNo: string, year: number): HRDocument {
  return {
    id: refNo,
    type: "appointment",
    title: "Appointment",
    refNo,
    status: "issued",
    employeeName: "Test",
    department: "Engineering",
    jobTitle: "Engineer",
    issueDate: `${year}-01-01`,
    body: "<p>x</p>",
    createdBy: "HR",
    createdAt: 0,
  }
}

test("reference numbers ignore other years and other companies", () => {
  const existing = [
    doc("NW/APT/2025/9999", 2025),
    doc("ZZ/APT/2026/0042", 2026),
    doc("NW/EXP/2026/0043", 2026),
    doc("NW/APT/2026/0003", 2026),
  ]
  assert.equal(nextRefNo("appointment", existing, 2026, "North Wind"), "NW/APT/2026/0004")
  assert.equal(nextRefNo("appointment", [], 2026, "North Wind"), "NW/APT/2026/0001")
  assert.equal(companyRefCode("Northwind Co"), "NC")
  assert.equal(companyRefCode(), "CO")
})

test("approving leave increases used days and never goes negative", () => {
  const req: LeaveRequest = {
    id: "r1",
    employeeId: "u1",
    employeeName: "Alex",
    initials: "A",
    type: "vac",
    status: "approved",
    startDate: "2026-11-21",
    endDate: "2026-11-23",
    days: 3,
    reason: "test",
  }
  const after = adjustBalance({ u1: defaultBalances }, req, 3)
  assert.equal(after.u1.annual.used, 3)
  assert.equal(after.u1.sick.used, 0)

  const refunded = adjustBalance(after, req, -10)
  assert.equal(refunded.u1.annual.used, 0)
})

test("CSV quotes values containing commas, quotes and newlines", () => {
  const csv = toCsv(
    [{ v: 'Doe, Jane\n"Jr."' }],
    [{ key: "v", label: "Value" }],
  )
  // The quoted field itself contains a newline, so don't split the CSV here.
  assert.equal(csv, 'Value\n"Doe, Jane\n""Jr."""')
})
