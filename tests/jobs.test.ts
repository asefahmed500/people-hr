import assert from "node:assert/strict"
import { test } from "node:test"

import {
  BASE_BACKOFF_MS,
  backoffDelayMs,
  canTransition,
  isDue,
  isJobLike,
  isStaleRunning,
  isTerminal,
  normalizeError,
  retryDecision,
  trimJobs,
  type Job,
} from "../lib/jobs/types"

const NOW = Date.parse("2026-11-21T12:00:00.000Z")

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "j-1",
    type: "report.generate",
    payload: {},
    status: "queued",
    attempts: 0,
    maxAttempts: 3,
    createdAt: "2026-11-21T11:00:00.000Z",
    runAfter: "2026-11-21T11:00:00.000Z",
    ...overrides,
  }
}

test("backoff grows exponentially and respects base and cap", () => {
  assert.equal(backoffDelayMs(0, 1000, 100_000), 1000)
  assert.equal(backoffDelayMs(1, 1000, 100_000), 2000)
  assert.equal(backoffDelayMs(2, 1000, 100_000), 4000)
  assert.equal(backoffDelayMs(3, 1000, 100_000), 8000)
  assert.equal(backoffDelayMs(9, 1000, 5000), 5000)
  assert.equal(backoffDelayMs(-3, 1000, 100_000), 1000)
  assert.equal(backoffDelayMs(Number.NaN, 1000, 100_000), 1000)
})

test("retry decision requeues with backoff until attempts are exhausted", () => {
  const retry = retryDecision(1, 3, NOW)
  assert.equal(retry.status, "queued")
  assert.equal(Date.parse(retry.runAfter), NOW + BASE_BACKOFF_MS * 2)
  assert.equal(retry.finishedAt, undefined)

  const last = retryDecision(3, 3, NOW)
  assert.equal(last.status, "dead")
  assert.equal(Date.parse(last.runAfter), NOW)
  assert.ok(last.finishedAt)

  assert.equal(retryDecision(0, 1, NOW).status, "queued")
  assert.equal(retryDecision(5, 2, NOW).status, "dead")
})

test("status transitions only allow forward progress", () => {
  assert.equal(isTerminal("succeeded"), true)
  assert.equal(isTerminal("dead"), true)
  assert.equal(isTerminal("queued"), false)
  assert.equal(canTransition("queued", "running"), true)
  assert.equal(canTransition("running", "succeeded"), true)
  assert.equal(canTransition("running", "queued"), true)
  assert.equal(canTransition("failed", "queued"), true)
  assert.equal(canTransition("queued", "queued"), true)
  assert.equal(canTransition("succeeded", "queued"), false)
  assert.equal(canTransition("dead", "running"), false)
  assert.equal(canTransition("running", "succeeded") && isTerminal("succeeded"), true)
})

test("due and stale-running checks are pure and safe on bad dates", () => {
  const due = makeJob({ status: "queued", runAfter: new Date(NOW - 1000).toISOString() })
  assert.equal(isDue(due, NOW), true)
  assert.equal(isDue({ ...due, status: "running" }, NOW), false)
  assert.equal(isDue({ ...due, runAfter: "not-a-date" }, NOW), false)
  assert.equal(isDue({ ...due, runAfter: new Date(NOW + 1000).toISOString() }, NOW), false)

  const old = makeJob({ status: "running", startedAt: new Date(NOW - 20 * 60_000).toISOString() })
  assert.equal(isStaleRunning(old, NOW), true)
  assert.equal(isStaleRunning({ ...old, status: "queued" }, NOW), false)
  assert.equal(isStaleRunning(makeJob({ status: "running" }), NOW), true)
  assert.equal(
    isStaleRunning(makeJob({ status: "running", startedAt: new Date(NOW - 1000).toISOString() }), NOW),
    false,
  )
})

test("trimJobs drops oldest terminal work first and never drops running jobs", () => {
  const jobs = [
    makeJob({ id: "old-succeeded", status: "succeeded", createdAt: "2026-01-01T00:00:00.000Z" }),
    makeJob({ id: "old-dead", status: "dead", createdAt: "2026-01-02T00:00:00.000Z" }),
    makeJob({ id: "failed", status: "failed", createdAt: "2026-01-03T00:00:00.000Z" }),
    makeJob({ id: "queued", status: "queued", createdAt: "2026-01-04T00:00:00.000Z" }),
    makeJob({ id: "running", status: "running", createdAt: "2026-01-05T00:00:00.000Z" }),
  ]
  const trimmed = trimJobs(jobs, 3).map((job) => job.id)
  assert.deepEqual(trimmed, ["failed", "queued", "running"])

  const many = Array.from({ length: 310 }, (_, i) =>
    makeJob({ id: `s-${i}`, status: "succeeded", createdAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z` }),
  )
  assert.equal(trimJobs(many).length, 300)
  assert.equal(trimJobs(jobs, 1).map((job) => job.id)[0], "running")
})

test("normalizeError strips stacks and bounds length", () => {
  const withStack = new Error("boom")
  withStack.stack = "Error: boom\n  at somewhere (file.ts:1:1)"
  assert.equal(normalizeError(withStack), "boom")
  assert.equal(normalizeError("  plain   error "), "plain error")
  assert.equal(normalizeError({ code: 42 }), '{"code":42}')
  assert.ok(normalizeError("x".repeat(2000)).length <= 500)
  assert.equal(normalizeError(null), "null")
})

test("isJobLike rejects malformed stored jobs", () => {
  assert.equal(isJobLike(makeJob()), true)
  assert.equal(isJobLike({ ...makeJob(), status: "bogus" }), false)
  assert.equal(isJobLike({ ...makeJob(), type: "not.a.type" }), false)
  assert.equal(isJobLike({ ...makeJob(), attempts: undefined }), false)
  assert.equal(isJobLike(null), false)
  assert.equal(isJobLike("nope"), false)
})
