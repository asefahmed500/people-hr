# Deep use-case verification — PeopleHR

Date: 2026-11-22. Scope: every user-facing workflow in the HR system, verified two ways:

1. **Static deep traces** — complete code path from UI event → client handler → API → store merge → cross-module effect → UI result, for 35 scenarios across hiring/payroll, daily HR, and account/security/admin.
2. **Runtime journey harness** — `scripts/usecase-tests.mjs` (`npm run test:usecases`), which provisions unique users, drives complete journeys through the live API as admin / manager / employee / hired candidate, asserts invariants, and cleans up after itself. **47/47 checks pass.**

Supporting suites: `npm run test:unit` 40/40, `npm run test:roles` 102/102, `npm run build` clean.

---

## Coverage matrix

| Family | Use cases traced | Result |
|---|---|---|
| Job post → candidate → hire → employee → onboarding | posting, candidate capture, stage moves, atomic hire, idempotency, duplicate email, salary carry-over, audit + notification | **PASS** (analytics fields dead — remaining) |
| Employee record | add/edit, compensation fields, role-filtered self-slice, deactivation | **PASS** (orphans on deactivate — remaining) |
| Payroll | period runs, snapshot semantics, history, re-runs, skip rules, CAS, audit, notifications | **PASS** after fixes |
| Payslips | generation, duplicate guard, period matching, print, own/manager visibility | **PASS** after fix |
| Leave | submit/edit/cancel, overlap + balance fit, approval, self-approval block, status reconciliation, notifications | **PASS** after fix |
| Attendance | face enrol/approve/reset, face check-in identity binding, one/day, own-only reads | **PASS** (blind approval, no audit — remaining) |
| Onboarding | 8-task checklist, completion timestamps, advance, stable `employeeId`, hiree visibility | **PASS** after identity fix |
| Performance / Goals / Projects | CRUD in scope, team-score redaction, KR cycling, DnD, cross-dept injection | **PASS** (goals have no dept rollup — remaining) |
| Announcements / Activity | audience targeting, write block, role-scoped audit reads | **PASS** (200-event retention — remaining) |
| Auth / 2FA / Password / Sessions | signup, login pre-check, TOTP + backup codes, epoch revocation, role refresh, reset tokens | **PASS** (reset not audited — remaining) |
| Team management | create, role/department/manager change, self-protection, soft remove, old JWT death | **PASS** |
| Settings / Notifications / Billing | profile + avatar validation, sign-out everywhere, own-only notifications, honest billing | **PASS** |
| Documents / Reports / Analytics | letter merge + sanitization, upload/RAG ACL, schedules, live analytics, CSV safety | **PASS** (generate-now bypasses server — remaining) |
| Assistant / Agent / Jobs | role-scoped context, RAG admin-only, one-use approval tokens, admin-only queue | **PASS** |

---

## Bugs found by the deep pass — all fixed

| # | Severity | Bug | Fix |
|---|---|---|---|
| 1 | **P0** | Hires create `e-*` directory ids but users sign in with `u-*`/cuid ids. `isOwnRecord` returned `false` as soon as an id field was present but mismatched, so a hired person could **not see their own onboarding checklist, payslips, payroll rows or seeded leave balance**. | Added a verified-email bridge (`employeeEmail` / `hireEmail` / `ownerEmail`) used only when no id matches; never falls back to display name in that case. Set the bridge fields in hire, payroll, payslip and onboarding generators + zod schemas; payroll carve-out matches email too. Regression-tested. |
| 2 | **P1** | GET seed-on-read advanced `updatedAt` via CAS but returned the **old** `X-Module-Version`. A new user's first PUT sent a stale `If-Match`, got 409, and the optimistic edit was reverted. | Return the freshly read `responseVersion` in the normal GET header. |
| 3 | **P1** | Payslip generation matched the *first* payment across all periods, so generating a slip for a later period stamped it with an earlier period's gross/currency. | Resolve payment by the selected period first; legacy rows only as fallback; generation dialog lists only rows for that period. |
| 4 | **P1** | After `POST /api/payroll/run`, the client wrote local state back with the pre-run version → guaranteed 409 and a false "payroll changed elsewhere" toast. | Refetch authoritative state after the POST; success toast counts only newly created rows. |
| 5 | **P1** | A manager could not see their **own** leave request (dept lookup failed before the directory row was seeded), so self-approval was only accidentally blocked. | Manager leave read filter now includes own rows via `isOwn`; the server still rejects their approval in the merge. Both verified at runtime. |
| 6 | **P2** | Dashboard headcount included inactive employees while Analytics and Organization excluded them. | Dashboard passes only active employees to `KpiRow`. |
| 7 | **P2** | Employees were offered every department in the New Project form, but the server rejects new non-admin rows outside their own department → guaranteed failed save. | `scopeDepartments` now limits non-admins with a department to that department. |
| 8 | **P2** | No-op re-runs emitted "N payments ready" notifications and reported the whole period's gross as newly recorded. | Skip audit/notification when `processed === 0`; client counts only new rows. |
| 9 | **P3** | Repeat hire toasted "undefined onboarding task(s)". | The idempotent path now returns the existing task count. |
| 10 | **P3** | `employee_hired` / `payroll_recorded` notification types were missing from the TS union. | Added. |

---

## Remaining known gaps (not fixed in this pass)

These are real but lower priority or require product decisions:

1. **Job-posting analytics are dead.** `opening.applicants` and `postedDaysAgo` are written as `0` and never derived; candidates have no `openingId`. "0 applicants" and "roles aging 45d+" never change. Needs an opening link on candidates and derived counts.
2. **Activity log retains only 200 events** and prunes older ones permanently; `/api/activity` can never report more. Compliance needs longer retention/export.
3. **Deactivation is non-atomic** and leaves projects/goals orphaned; pending leave declines miss `e-*`/`u-*` mismatched rows in some paths. Also the `User.deactivatedAt` account is separate from directory `status:"inactive"`.
4. **`payFrequency` and `salaryEffectiveDate` are stored but ignored by payroll** — no conversion, proration or effective-dated history. A "biweekly" salary is paid as a full monthly gross. Needs a policy decision before implementing.
5. **No server-side payslip duplicate guard** — two admin tabs can both pass the client check. Also manual onboarding hires still lack `employeeId`, so same-named manual hires can merge in grouping.
6. **"Mark paid/failed" is effectively unreachable** — runs flip every row to paid and only non-paid rows expose the menu.
7. **Face-registration approval has no image preview** and face check-ins emit no activity event.
8. **"Generate now" in Reports is client-side** and bypasses `/api/reports/run-due` audit/notification semantics.
9. **Password-reset events are not audited;** password change resets the current session too, with no warning in the UI.
10. **~70 mojibake strings** remain in UI copy (e.g. `announcementâ€¦`, `Todayâ€™s`). Generated letter bodies are clean.
11. **Assistant LLM mode drops role-scoped context** (canned mode uses it); managers get no real numbers from the LLM path.

`AUDIT.md` §1–4 documents the earlier lifecycle/payroll/visibility/action-checking work; this document focuses on behavioral use-case verification and the bugs it exposed.

## How to re-run

```sh
npm run dev -- --port 3200   # in another terminal
npm run test:usecases        # or: node scripts/usecase-tests.mjs [baseUrl]
```
