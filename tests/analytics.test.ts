import assert from "node:assert/strict"
import { test } from "node:test"

import { computeAnalytics } from "../lib/analytics"
import type { Employee } from "../lib/data/employees"
import type { LeaveStore } from "../lib/data/leave"
import type { RecruitmentStore } from "../lib/data/recruitment"

const leave: LeaveStore = { requests: [], balances: {} }
const recruitment: RecruitmentStore = { candidates: [], openings: [] }

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: `e-${Math.random().toString(36).slice(2)}`,
    name: "Test Person",
    email: "test@example.com",
    initials: "TP",
    department: "Engineering",
    role: "Engineer",
    location: "Remote",
    status: "active",
    hiredDaysAgo: 0,
    ...overrides,
  }
}

test("headcount excludes inactive employees", () => {
  const result = computeAnalytics({
    employees: [employee(), employee({ status: "inactive" })],
    leave,
    recruitment,
  })
  assert.equal(result.headcount, 1)
})

test("tenure and hiring trends use the absolute hire date", () => {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const result = computeAnalytics({
    employees: [employee({ hiredAt: thisMonth, hiredDaysAgo: 0 })],
    leave,
    recruitment,
  })
  const current = result.monthlyTrend.find((m) => m.current)
  assert.equal(current?.value, 1)
  assert.match(result.headcountDelta, /^\+1$/)
  assert.equal(result.byTenure.reduce((sum, b) => sum + b.count, 0), 1)
})

test("fabricated deltas are empty, not fractions of the current value", () => {
  const result = computeAnalytics({
    employees: [employee({ status: "inactive" })],
    leave,
    recruitment: {
      candidates: [
        { id: "c1", name: "A", initials: "A", role: "R", department: "Engineering", appliedAt: "Today", stage: "hired" },
      ],
      openings: [],
    },
  })
  assert.equal(result.attritionDelta, "")
  assert.equal(result.offerAcceptRateDelta, "")
  assert.equal(result.avgTenureDelta, "")
  assert.equal(result.attrition, "100.0%")
  assert.equal(result.offerAcceptRate, "100%")
})
