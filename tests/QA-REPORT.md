# APPLICATION QA REPORT — PeopleHR

**Application:** PeopleHR dashboard (Next.js 16 App Router, Auth.js v5 + Prisma/PostgreSQL)
**Environment:** local production build (`npm run build` + `npm start -- --port 3001`)
**Browser:** real Chromium, headed, via Playwright 1.65.1
**Automation:** Playwright Test (`tests/e2e/`), 1 worker, serialized against the shared workspace store
**Run command:** `npm run test:browser`

## Coverage

| Metric | Value |
|---|---|
| Discovered pages/routes | 27 (20 authenticated shell modules + 7 public) |
| Discovered API route files | 31 |
| Interactive elements exercised | ~140 (nav links, dialogs, forms, selects, row menus, tabs, switches, exports, filters, command palette, theme, notifications) |
| Test cases executed | 48 |
| PASSED | 48 |
| FAILED | 0 |
| BLOCKED / NOT TESTED | 5 integrations (see below) |
| Screenshots captured | 104 (`tests/reports/screenshots/`, gitignored) |
| Reports | `tests/reports/results.json`, `tests/reports/html/index.html` (gitignored) |
| Build | `npm run build` — passed (57 static pages, 1 proxy) |
| Typecheck | `npm run typecheck` — passed |

## Verified end to end (UI → API → DB → UI)

- **Auth lifecycle:** landing, signup (real account created + deactivated), invalid/empty credentials, demo picker, login/logout, 2FA pre-check, session persistence, protected-route redirects, password-reset request.
- **Sign-out race regression:** 3 concurrent session refreshes during Sign out no longer resurrect the session.
- **RBAC:** all 20 routes for admin/manager/employee + anonymous; admin API prefixes return 403; employee sees only own directory/payslip/notifications; role escalation rejected.
- **Navigation & shell:** every sidebar route, theme toggle + persistence, Cmd+K palette, notification bell/mark-all-read, sidebar collapse, account menu, mobile nav.
- **CRUD:** employees (create/search/read/update/refresh/deactivate/reactivate/CSV), projects, goals + key results, announcements + pin, onboarding, reports, jobs, attendance, documents, leaves (employee request → admin approval → balance deduction).
- **Workflows:** payroll run records payments, payslips generated with correct values, HR letter compose/draft/delete, candidate → hire transaction (employee + leave balance + 8 onboarding tasks).
- **Security:** validation 400, duplicate/concurrency 409, unknown key 404, analytics read-only, CSRF-less signout rejected, stored XSS inert, httpOnly/Lax session cookie.
- **Responsive:** 1440×1000, 1366×768, 768×1024, 390×844 — no document-level horizontal overflow, no runtime errors.
- **Print/PDF quality:** payslip HTML has real employee/payroll fields and computed gross/deductions/net; A4 minimal shared stylesheet; letter alignment preserved through sanitizer.

## Bugs found and fixed

1. **Critical — sign-out could be undone by an in-flight session refresh.** Auth.js re-signs the JWT on every `/api/auth/session` read; a refresh started before Sign out re-set the cleared cookie, bouncing the user back to a live dashboard. Fixed with per-sign-in revocation (`lib/login-history.ts`, `lib/auth.ts`) checked in the JWT callback. Permanent regression test added.
2. **High — Settings "Job title" was never persisted.** The field updated local state only, and the profile PATCH overwrote the settings document while a debounced store PUT was pending. Fixed by sending `jobTitle` through `/api/user/profile` and writing it with a compare-and-swap in the route.
3. **Medium — Scheduled report actions clipped at bottom of card.** The inline menu was cut off by `overflow-clip`. Fixed by flipping the menu upward near the viewport edge and removing the clipping container.
4. **Low — horizontal overflow from nowrap button text.** Report and document template cards used a Button base class with `whitespace-nowrap`, spilling long descriptions past the viewport. Fixed with `whitespace-normal`, `min-w-0`, and word wrapping.
5. **Print quality — payslips and HR letters.** Payslip HTML now renders a clean salary statement (employee ID, period, earnings, deductions, totals, net pay, reference); shared print CSS is A4/system-font/minimal with print-safe page-break rules; sanitizer preserves safe alignment styles.

## Blocked / not tested (honest limitations)

- Real LLM responses: `LLM_API_KEY` is empty; assistant API was verified with its canned-response path (200 + rendered reply), not a live provider.
- Stripe billing/payments: no `STRIPE_SECRET_KEY`; app correctly reports payments not configured. No real charges attempted.
- Google OAuth: disabled (`NEXT_PUBLIC_GOOGLE_ENABLED=false`).
- Email delivery: no `RESEND_API_KEY`; password reset verified through the development link fallback.
- Face enrollment/check-in and document RAG upload/search: require camera descriptors / embeddings keys; not exercised.

## Evidence & hygiene

- Test suites: `tests/e2e/00-smoke.spec.ts` … `08-print-quality.spec.ts`, shared fixtures/helpers in `tests/e2e/helpers.ts`.
- `tests/reports/` is gitignored because it contains saved authenticated browser states (session tokens) and large binary evidence.
- Test setup clears only reserved rate-limit/login-lock fixture scopes and restores the demo employee's leave balance before each run; no production/customer data touched.
