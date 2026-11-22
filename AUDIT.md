# PeopleHR — Full Lifecycle Audit & Remediation Plan

Audit date: 2026-11-22. Scope: job post → applicant → hire → employee → onboarding → payroll → payslips, plus role-based visibility and the Stripe integration. This is a read-only audit of the current tree; the fixes listed as **Done** were implemented alongside it.

## Architecture recap

- Next.js 16 App Router, Auth.js v5, PostgreSQL/Prisma.
- Feature data is **JSON documents** in `ModuleState` (keyed by `scopeId` + module key), served by one generic route `app/api/store/[key]/route.ts`. The old relational `Employee`/`Candidate`/`Payment`/`PayrollMeta` models in `prisma/schema.prisma` are unused.
- Roles: `admin` | `manager` | `employee`. Enforcement is server-side (`proxy.ts`, `lib/auth-guards.ts`, `filterForRole` in the store route, `lib/non-admin-merge.ts`); UI guards are cosmetic mirrors.
- Every PUT to `/api/store/[key]` is validated with a whole-document zod schema from `lib/store-schemas.ts`. **New fields must be added there or they are silently stripped.**
- Non-admin writes are merges: the client PUTs its role-filtered slice; out-of-scope rows are preserved server-side. Privileged fields must be denylisted in `lib/non-admin-merge.ts`.

---

## 1. Lifecycle: job post → hire → onboarding

### What exists
| Stage | Implementation | State |
|---|---|---|
| Job post | `PostJobDialog` → `Opening{title,department,location,applicants,postedDaysAgo}` | `openings` and `applicants` are **never advanced** — a new role always shows "0 applicants / 0 days". |
| Applicant | `CandidateDialog` — name, role, department, source only | No email, phone, resume, expected salary, requisition link, or notes. `appliedAt` is the literal string `"Today"`. |
| Interview | Only a Kanban column label | No interviews, interviewers, scorecards, feedback, or rejection reasons. |
| Offer | Only a stage label; offer letters are a separate `/documents` template | No offer amount, start date, acceptance state, or link to the letter. |
| Hire | `moveTo(...,"hired")` in `recruitment-page-client.tsx:134-184` creates an Employee + leave balance in the client | **No onboarding tasks, no User account, no salary, no server transaction.** Three independent debounced PUTs; a failure leaves partial state. Duplicate detection is name-only (email is always `""`). |
| Employee record | `newEmployee()` + add/edit dialog | Hires get `email:""`, `location:"Remote"`, no employment type/manager/salary. Two parallel identities exist (`e-*` directory rows vs `u-*` account rows auto-injected by the store route). |
| Onboarding | Manual "Add new hire" creates exactly one `"Paperwork pending"` task | **No inbound wiring from hiring.** No employee id on tasks, so ownership falls back to display name — two hires with the same name collide. |
| Payroll | Manual run against the directory | Hires have no salary → permanently skipped. |

### Root causes
1. Hire is a **client-only side effect** — no server endpoint performs the transition, so it can't be atomic, retryable, or audited beyond three separate activity rows.
2. `OnboardingTask` has no `employeeId`; `role-scope.ts` falls back to name matching for such rows, which is a collision/leak vector.
3. `Candidate` has no contact/offer fields, so the hire can't carry email or compensation into the directory.
4. The automation engine (`lib/automation/*`) is never imported anywhere — all lifecycle rules are inert.

### Done
- New admin-only server endpoint `POST /api/lifecycle/hire` that, in one Prisma transaction: validates the candidate, creates the Employee, seeds the leave balance, generates a standard onboarding checklist keyed by `employeeId`, and moves the candidate to `hired`. The recruitment board now calls it instead of doing three client writes.
- `OnboardingTask.employeeId` added (type, zod, generator), so ownership uses a stable id instead of a name.
- `Candidate.email`/`phone`/`offeredSalary` added and captured in the applicant dialog, so a hire carries real contact and pay data.

### Remaining work (recommended, not done here)
- Interview records / scorecards, offer acceptance state, and requisition linking.
- Provision a `User` account + invite on hire (requires email delivery and an explicit policy decision — do not auto-guess passwords).
- Wire or delete `lib/automation/*`; make `openings.applicants` and `postedDaysAgo` derived from candidate/applied dates.
- Unify `e-*` directory ids with `u-*` account ids via one stable `employeeId` across all modules.

---

## 2. Payroll & compensation

### What exists
- `Employee.salary?: number` — optional whole-dollar amount, implicitly **monthly gross USD**. No currency, pay frequency, effective date, or revision history.
- `Payment{id,initials,name,role,department,gross,deductions,status}` — no `employeeId`, no period, no currency, no payment reference. The id `pay-${employeeId}` means **one row per employee forever**: there is no monthly history.
- "Run payroll" (`payroll-page-client.tsx:58-90`) generates rows with `deductions: 0`, then immediately flips them to `paid`, sets one `lastRun` timestamp, and toasts. **No API call, no approval, no money movement, no payslips.** "Paid" is just a local flag in a JSON blob.
- `PayRunSummary` hardcodes an employer cost of `gross * 1.096` (9.6% burden). Money formatting is hardcoded `en-US`/USD in `payroll.ts`, `payslips.ts`, and the payroll components.
- Payslips (`/payslips`) are generated **manually and separately**, matching payments to employees by name (wrong-person risk), always with `status: "draft"`, and with invented earnings/deduction splits (45/18/8/12 and 55/25/12) that only reconcile because deductions are always zero.
- **Stripe is unrelated to payroll.** `app/api/billing/route.ts` is an admin-only read of the app's subscription state using `STRIPE_SECRET_KEY` + `User.stripeCustomerId`. It degrades honestly when unconfigured, but nothing ever sets `stripeCustomerId`, so it is always unconfigured. No Stripe npm package; raw `fetch` is used. No transfers/payouts/charges anywhere.

### Done
- Employee compensation model extended with `salaryCurrency`, `payFrequency`, `salaryEffectiveDate`, and a **stripeCustomerRef** / display-only `cardBrand` / `cardLast4`. All optional, admin-only, and denylisted in the non-admin merge.
- `Payment` extended with `employeeId`, `period` (YYYY-MM), `currency`, `paymentReference`, and `recordedAt`. Runs are now **per period** (`pay-{employeeId}-{period}`), so history accumulates. Money formatting takes a currency argument.
- "Run payroll" is now a real server-side business operation (`POST /api/payroll/run`), not a client JSON replace: admin-only, period-keyed, optimistic-concurrency guarded, audit-logged, and it notifies other approvers that rows are ready to export. Runs accumulate history instead of overwriting one row per employee, and all UI copy (confirm dialog, toast, table subtitle, timeline) states plainly that **no money is sent**. Deductions still start at zero and payslip bucketing remains a fixed split — see Remaining work.
- Payslips carry currency end-to-end (`buildPayslip` → zod → print HTML), and generation matches on `employeeId` first, with the legacy `pay-*` id only as a fallback.
- New admin-only read-only Stripe lookup route `GET /api/payroll/stripe?customerId=...` that verifies a stored customer reference with Stripe's API when `STRIPE_SECRET_KEY` is configured and reports "not configured" otherwise. **No write, charge, transfer, payout, or portal session is created.** Card data is never collected in the client; only Stripe ids and brand/last4 are stored.

### Explicitly out of scope (per your choice)
You chose **"store salary data only"**, so no funds move. There is no Stripe Connect onboarding, no `/v1/transfers` or `/v1/payouts`, no bank-account collection, and no tax withholding engine. Those would need live keys, bank/tax compliance, and a separate approval flow.

### Remaining work
- Payroll runs as a first-class entity (`draft → review → approved → paid`) with approver, approval timestamp, and audit trail.
- Configurable earnings/deduction rules per jurisdiction and a real tax engine; effective-dated salary history.
- Auto-issue immutable payslips as part of an approved run; remove the fixed percentage splits.

---

## 3. Role visibility

### What exists
- Employees are self-scoped by `isOwnRecord()` on most shared modules; managers get department scope; admins see everything.
- Admin-only keys return empty structures to non-admins: `recruitment`, `analytics`, `reports`, `organization`, `payroll`, `documents`.
- Employees may **write** only `employees`, `leave`, `projects`, `goals`; `performance`, `onboarding`, `attendance`, `payslips`, `announcements` are read-only.
- Own payslips are already readable; own payroll row was **not** (payroll was wholly admin-only).
- Own onboarding tasks were already returned by the server filter, but `/onboarding` was admin/manager-only in `proxy.ts` and the page guard — employees effectively saw nothing.
- Primary leak risk: name-based identity fallback for rows without stable ids (onboarding, goals, projects, performance, attendance).

### Done
- `/onboarding` is accessible to employees; the page client is read-only for them, and both task grouping and "advance hire" now use `employeeId` instead of a display name.
- `payroll` now has a narrow carve-out for **employees only**: the GET filter returns just their own payment rows, matched by `employeeId` (legacy `pay-{id}` rows are matched by id for back-compatibility). Managers still get no payroll data; the `/payroll` page stays admin-only and read-only for non-admins; payslips stay non-writable. Employees see their own rows as a "My pay records" panel on `/payslips`.
- The carve-out reuses `filterForRole`, so PUT responses (`filterWriteResponse`) stay in sync automatically.

### Deliberately not widened (security)
`documents` (HR letters), `recruitment` (candidates), `analytics` (company-wide), `reports`, `organization` internals, `teamScores`, and any write access to payroll/payslips. Adding another employee to `NON_ADMIN_WRITABLE` would allow salary tampering.

---

## 4. "Every action is checked" hardening pass

A separate audit covered all 34 API route files (43 handlers), every UI mutation surface, and the audit-trail coverage. Every mutating action was traced from UI to server; the gaps below were real and are fixed.

### Server-authorization gaps closed
- **Agent RAG leak (P0):** `/api/agent/execute` is available to any signed-in user, but the document corpus contains confidential HR letters and `/api/documents/search` is admin-only for that reason. The orchestrator retrieved chunks with no ACL. It now only retrieves for `role === "admin"` (`lib/agent/orchestrator.ts`), so the agent can no longer be used as an exfiltration path. Client-supplied context sizes are bounded.
- **Agent approval bypass (P0):** approval was just a client-supplied boolean. Approvals are now server-issued short-lived tokens bound to user + tool + argument hash, single-use, and consumed with CAS before the executor runs (`lib/agent/approvals.ts`, `/api/agent/approve`). Unavailable tools are rejected outright, and the endpoint is rate-limited and audit-logged. `execute` returns `approvalId` per pending action.
- **Manager privilege escalation (P1):** the privileged-field denylist only protected *changed existing* employee rows. A manager could forge a direct PUT adding a new row in their own department with `salary`/Stripe refs, which admin payroll would then snapshot as real pay. New non-admin rows may no longer carry compensation fields or be created inactive (`lib/non-admin-merge.ts`).
- **Manager self-approval (P1):** the "don't approve your own leave" rule applied only to employees. Managers could approve their own request via direct PUT and inflate their balance. Now nobody may decide their own request, regardless of role.
- **Cross-department task injection (P1):** employees could set an arbitrary `department` on a new project task, making it visible to another department's manager. New non-admin rows are now constrained to the writer's own department.
- **Proxy fail-closed (P1):** admin-only API prefixes (`/api/users`, `/api/billing`, `/api/jobs`, `/api/reports`, `/api/documents`, `/api/payroll`) now return 403 for non-admins even if a future handler forgets its own `requireAdmin()`.
- **UX honesty:** the "cancel approved leave" action was offered in the UI but always rejected/reverted by the server; it is now hidden by only allowing pending withdrawals.

### Checked-action helper
`lib/action-check.ts` provides `checkAction(request, { roles, schema, rateLimit })` — authentication, role authorization, zod validation (with field-level error details) and a per-user rate limit in one call, so a handler cannot accidentally skip a check. `lib/rate-limit.ts` now supports a `subject` key so authenticated budgets are per user rather than per shared office IP. Applied to agent execute/approve, documents search/upload, assistant chat, password change, and the other routes identified in the audit.

### Audit-trail coverage added
Previously only store PUTs, sign-in, hire and payroll run were logged. Added security/compliance events for: team member create / role change / removal, password change, 2FA setup/enable/disable, self-deactivate, revoke-all-sessions, document upload/search (metadata only — never query or retrieved text), and agent tool approval. `payslips`, `users`, `security` and `agent` were added to the activity filter list. `approved`/`declined` action types (previously defined but never emitted) are now used by agent approval.

### Explicitly not changed
Navigation-only Cmd+K entries (`check-attendance`, `review-pending-leave`, etc.) have no handler but also grant no authority; they are no-ops, not bypasses. Notification read/delete is already ownership-checked (`api/notifications/[id]`) and high-volume, so it stays out of the activity log by design. The generic store route was left unchanged — it was already correct and is covered by the regression suite.

---

## 5. Button design system

A single centralized component (`components/ui/button.tsx`) now owns every action surface in the app.

- **Variants:** `default` (primary, solid), `secondary`, `outline`, `ghost`, `destructive`, `link`, `soft`. Icon buttons use the `icon*` sizes rather than a separate variant.
- **Consistent scale:** 8px radius (`rounded-lg`) everywhere; heights 32/36/40/44px (xs/sm/default/lg); horizontal padding 12/16/20/24px; min-widths per text size so a label swap never changes layout.
- **Hierarchy:** one solid primary per view, quiet outline/secondary alternatives, tinted soft for highlights, unmistakable destructive red, flat ghost/link for dense tables and toolbars. No pill-shaped action buttons.
- **Interactions:** exact-property transitions (150ms, `--ease-smooth-out`) on background, border, colour, shadow and transform; subtle press (`active:scale-0.98`); restrained shadows; focus-visible ring with offset; opt-in `.button-arrow` micro-interaction for forward arrows.
- **Loading states:** `loading` + `loadingText` show a spinner and swapped label, set `aria-busy`, disable the control and prevent duplicate submissions while preserving dimensions.
- **Accessibility:** real `<button>` semantics, visible focus rings, `aria-busy`/`aria-pressed`/`aria-current` where relevant, reduced-motion guard for the label animation in `app/globals.css`.
- **Migration:** 47 raw ad-hoc `<button>` elements were reduced to 3 intentional exceptions (a hidden form submit, the shadcn sidebar rail primitive, and the calendar day card). Shared triggers (`ExportButton`, `FilterButton`), data-table controls, header/nav buttons, auth pages, landing CTAs, dialogs and all async actions now use the system. `ActionDialog` and `ConfirmDialog` share the same loading treatment.

Shared motion tokens (`--duration-*`, `--ease-smooth-out`, `--distance-micro`, `--blur-small`) live in `app/globals.css`; the label-swap keyframes are guarded by `prefers-reduced-motion`.

---

## 6. Verification & docs

- Docs consulted: Next.js 16 local docs in `node_modules/next/dist/docs/` (route handlers, async `params`, proxy) and Context7 for Stripe Node SDK customer APIs and Next.js App Router route handlers.
- Verification run on this tree: `npm run typecheck` clean, `npm run lint` clean, `npm run build` clean (57 static pages; new `/api/lifecycle/hire`, `/api/payroll/run`, `/api/payroll/stripe` routes present), `npm run test:unit` **39/39**, `npm run test:roles` **102/102** against a temporary dev server on port 3200 (covers hire transition, own-payroll visibility, payroll run, and manager privilege escalation). Button surfaces were also visually verified in a real browser (login, dashboard, directory and a form dialog).
- No Prisma migration is required: the store-only Stripe design keeps references in `ModuleState`, and `User.stripeCustomerId` already exists in the schema.

## Priority order for anything beyond this pass

1. Server-side, transactional lifecycle transition including User provisioning (done for the data part above; account/invite still open).
2. Stable identity unification across `e-*` / `u-*` records.
3. Payroll run entity with approval workflow and audit trail.
4. Interview/offer data model.
5. Wire or remove the dead automation engine; fix mojibake strings across UI copy.
