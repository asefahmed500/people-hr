<!-- This file is auto-maintained by OpenCode. Do not add content that can be read from code. -->

# PeopleHR Dashboard

**This is NOT a Sales Commission system.** It's an **HR dashboard** — full-stack: Next.js App Router + Auth.js + PostgreSQL (Prisma).

## Architecture

- **Next.js 16 App Router** — check `node_modules/next/dist/docs/` before writing code (breaking changes possible). `middleware.ts` is renamed to `proxy.ts` (node runtime); `cookies()`/`params`/`searchParams` are async-only.
- **No `src/`** — source lives at root: `app/`, `components/`, `lib/`, `hooks/`
- **Path alias:** `@/*` → `./*`
- **Auth:** Auth.js v5 (`next-auth@beta`) + `@auth/prisma-adapter`, JWT session strategy. Google OAuth2 provider (active only when `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are real, gated by `NEXT_PUBLIC_GOOGLE_ENABLED`) + Credentials provider (email/password, `bcryptjs`). Config in `lib/auth.ts`; handler exported at `app/api/auth/[...nextauth]/route.ts`; registration at `app/api/auth/register/route.ts`. Route protection via `proxy.ts`.
- **Database:** PostgreSQL via Prisma. Schema at `prisma/schema.prisma`. Client singleton at `lib/db.ts`. Seed at `prisma/seed.ts` (`npm run db:seed`) — creates ONLY the demo admin + empty module-state shells; NO demo people/data (the DB starts empty, first-run UI shows empty states). Env: `DATABASE_URL` in `.env`.
- **Data layer:** the 14 feature modules persist as JSON documents in the `ModuleState` table (keyed by `scopeId` + module `key`), served by ONE generic route `app/api/store/[key]/route.ts`. SHARED modules (`employees`, `leave`, `recruitment`, `projects`, `goals`, `payroll`, `performance`, `onboarding`, `attendance`, `organization`, `analytics`, `reports`) live under a single workspace scope (`__workspace__`) and are role-filtered on read; personal modules (`settings`, `assistant`) are per-user. GET is seed-on-read (upsert); PUT validates against zod schemas and supports optimistic concurrency via `If-Match` / `X-Module-Version` (409 on mismatch). Analytics is NOT stored — it's computed live from employees/leave/recruitment documents (`lib/analytics.ts`); organization headcounts are likewise reconciled live.
- **Relational vs JSON-doc:** `User`, `Account`, `Session`, `VerificationToken`, `Notification` (+ chat tables) are real rows. Everything else feature-related lives in `ModuleState` — several older relational models (employees/leave/etc.) exist in the schema but are **unused**. Client reads/writes via `useApiStore` in `hooks/use-api-store.ts`; seed defaults live server-side in `lib/module-defaults.ts`.

## Routes

17 shell modules — all wrapped in `<DashboardShell activeHref={...} current={...}>` (most in `page.tsx`, a few inside the `*-page-client.tsx` skeleton branch):
`/dashboard` (Dashboard) · `/employees` · `/organization` · `/attendance` · `/leave` · `/recruitment` · `/onboarding` · `/projects` · `/performance` · `/goals` · `/payroll` · `/reports` · `/documents` (admin-only HR letter generation + PDF export) · `/announcements` (admin writes, everyone reads) · `/analytics` · `/assistant` · `/settings`

- The landing page lives at `/` (`app/page.tsx` + `app/landing-home-client.tsx`; no `app/landing/` route) and redirects to `/dashboard` when already authed.
- Public pages (outside the shell): `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`.

## Roles & Authorization

Three roles: `admin` | `manager` | `employee`. Enforcement is server-side; the UI mirrors it.

- API routes use guards from `lib/auth-guards.ts` (`requireAuth` / `requireRole` / `requireAdmin` / `requireManager`, plus a page-level redirect helper). Use these — don't hand-roll `auth()` checks.
- Non-admins only SEE a role-filtered slice of shared module documents (managers: their department; employees: their own records). When they PUT that slice back, `lib/non-admin-merge.ts` treats it as "scope replaced": rows OUTSIDE the user's scope are preserved untouched. Never "fix" this by letting non-admins replace whole documents.
- Admin-only modules (`recruitment`, `analytics`, `reports`, `organization`, `payroll`, `documents`) resolve to empty structures for non-admins on both GET and PUT.
- Every PUT to `/api/store/[key]` is validated against per-key zod schemas in `lib/store-schemas.ts` — new module fields must be added there or writes get rejected.
- Client-side form/scope restrictions mirror the server via `lib/role-scope.ts` — keep both in sync.
- Managers are redirected away from `/employees` and `/onboarding` by `proxy.ts`.

## State Pattern

```ts
const { state, setState, reset, hydrated } = useApiStore<T>("/api/store/x", () => defaultData)
```

- `hydrated` → `false` until the `GET` resolves. Show `<Skeleton>` before it's `true`.
- `setState(updater)` applies optimistically and schedules a debounced `PUT` (400ms). On PUT failure it toasts + re-fetches server truth (reverts); on GET failure it toasts once.
- Stores are keyed by endpoint in a shared registry — components on the same `/api/store/x` share ONE Zustand store (hydration runs once; cross-module reads/writes like dashboard↔leave stay in sync for free).
- `reset()` writes the seed default back to the server.
- Notification bell + every page action use the shared Zustand store at `lib/stores/notifications.ts`. Push a notification from anywhere via `pushNotification(...)` (fire-and-forget, optimistic). The bell (`components/dashboard/top-bar.tsx`) calls `ensureLoaded()` on mount.
- Auth: `useAuth()` from `hooks/use-auth.ts` is backed by `useSession()`; `login`/`signup`/`loginWithGoogle` are **async** (`await` them in handlers). `logout()` is fire-and-forget.

## Key Imports

| Purpose | Import |
|---------|--------|
| Module store | `useApiStore` from `@/hooks/use-api-store` |
| Push notification | `pushNotification` from `@/lib/stores/notifications` |
| Server query | `prisma` from `@/lib/db` (server-only) |
| Server auth | `auth`, `signIn`, `signOut` from `@/lib/auth` (server-only) |
| API client | `apiRequest` from `@/lib/api-client` (client) |
| Cmd+K action | `onAction(id => ...)` from `@/lib/command-actions` |
| Toast | `notify.success/info/error` from `@/lib/toast` |
| Class merge | `cn()` from `@/lib/utils` |
| Form dialog | `ActionDialog` (accepts `submitting` prop for loading state) from `@/components/shared/dialog-parts` |
| Table | `DataTable` from `@/components/shared/data-table` |
| Form fields | `Field`, `SelectField`, `TextArea`, `useForm` from `@/components/shared/field` |
| Confirm dialog | `ConfirmDialog` from `@/components/shared/confirm-dialog` |
| Loading skeleton | `SkeletonCard` from `@/components/shared/skeleton-card` |
| Validation | `z` from `zod` |
| Icons | `lucide-react` |
| shadcn/ui | `@/components/ui/*` (44 components) |

## Component Layout

- Each module has: `app/{module}/page.tsx` (server shell) + `app/{module}/{module}-page-client.tsx` (client state/wiring) + `components/{module}/` (leaf components)
- Exception: the Dashboard page-client lives at `app/dashboard-page-client.tsx` (not in a subfolder)
- Leaf components get interactivity wired through props from the page-client
- Shared widgets: `components/dashboard/` (KpiRow, GreetingBanner, headcount chart, etc.)

## Dev Commands

```sh
npm run dev       # dev server (Turbopack)
npm run build     # production build
npm run lint      # eslint
npm run format    # prettier
npm run typecheck # tsc --noEmit
npm run db:push   # prisma db push (sync schema)
npm run db:seed   # prisma db seed (demo user + module data)
npm run db:studio # prisma studio
npm run db:reset  # drop + recreate all tables + re-seed (destructive)
npm run test:roles # role-based integration tests vs a RUNNING dev server
```

`test:roles` (`scripts/role-tests.mjs`, no unit-test framework) defaults to `http://localhost:3200` — start the dev server on that port or pass a baseUrl as argv. It self-provisions: registers manager/employee users via the register API, promotes the manager (admin PATCH `/api/users/:id`), seeds directory fixtures via the store API, then exercises the store API, proxy redirects, and cross-module flows. No CI.

## Backend / Env

- `.env` (gitignored) holds: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` (placeholders until configured), `NEXT_PUBLIC_GOOGLE_ENABLED`, `NEXTAUTH_URL`, optional `SMTP_*` (password-reset email), `LLM_API_KEY`/`LLM_BASE_URL`/`LLM_MODEL` (AI assistant), `STRIPE_SECRET_KEY`/`STRIPE_PORTAL_URL` (billing). All optional integrations read their var and degrade gracefully when empty — don't delete the placeholder keys.
- Auth.js adapter models (`User`, `Account`, `Session`, `VerificationToken`) are relational. The seed creates exactly ONE real user — the demo admin (`asef.ahmed@northwind.co` / `demo1234`, bcrypt-hashed); manager/employee accounts are created at runtime (register API / role tests), not seeded.
- Notifications (`Notification`) + chat (`Conversation`, `ChatMessage`) are relational and per-user; feature data is in `ModuleState` (see Data layer above).
- **Google sign-in** stays inert until real `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are added AND `NEXT_PUBLIC_GOOGLE_ENABLED=true`. Redirect URI: `http://localhost:3001/api/auth/callback/google`.
- **2FA:** TOTP via `otplib` (`lib/totp.ts`). Enroll at `/api/auth/2fa/setup` → verify `/api/auth/2fa/enable`; disable requires password. Credentials `authorize` requires a code (or one-time backup code) when `User.twoFactorEnabled` is true; `/api/auth/2fa/required` pre-checks login.
- **Password reset:** `/forgot-password` → `/api/auth/forgot-password` issues a hashed `VerificationToken`; without an SMTP transport the reset link is shown in the UI (dev fallback). `/reset-password` completes it.
- **Billing:** `/api/billing` is Stripe-ready (uses `STRIPE_SECRET_KEY` + `User.stripeCustomerId`); without keys it reports payments aren't configured (honest, no fakes).
- **AI assistant:** `/api/assistant/chat` calls an LLM (OpenAI-compatible) when `LLM_API_KEY` is set, else falls back to `replyFor()` canned replies. The client posts and streams a reply into the "Thinking…" bubble.
- **Cross-module integrity:** hiring a candidate adds an Employee + leave balance; approving leave flips the employee status; adding an employee seeds a leave balance; the deactivate dialog lists orphaned leave/projects/goals.
- **After schema changes:** run `npm run db:push` then `npx prisma generate` (the dev server must be stopped during generate — it locks the query-engine DLL on Windows). The Prisma CLI reads `.env` (not `.env.local`); `next dev` may bind a different port than `PORT` unless passed `--port`.

### API routes (18)

| Route | Purpose |
|-------|---------|
| `app/api/auth/[...nextauth]/route.ts` | Auth.js handler (re-exports `GET`/`POST` from `lib/auth`) |
| `app/api/auth/register` | Credentials signup (creates `User` + settings row) |
| `app/api/auth/forgot-password` · `reset-password` | Password-reset token issue/complete |
| `app/api/auth/2fa/setup` · `enable` · `disable` · `required` | TOTP enrollment/verify + login pre-check |
| `app/api/assistant/chat` | LLM-or-canned chat |
| `app/api/billing` | Stripe-ready billing state |
| `app/api/notifications` · `app/api/notifications/[id]` | Per-user notification CRUD |
| `app/api/store/[key]` | Generic module GET (seed-on-read) / PUT (validated replace + merge) |
| `app/api/user/profile` · `password` · `deactivate` | Real `User` updates |
| `app/api/users` · `app/api/users/[id]` | Team member list/create + role/remove |

## CSS

- Tailwind v4 (`@import "tailwindcss"`, not `@tailwind` directives)
- Dark variant: `@custom-variant dark (&:is(.dark *))`
- Theme managed by custom `ThemeProvider` (not next-themes), init script via `next/script` in `layout.tsx`
- shadcn style: `radix-nova`, base color: `neutral`

## Conventions

- Use `export function` (never `export default`) for component exports
- Use `"use client"` on any file with state, effects, or event handlers
- Server components stay in `page.tsx`, client logic goes in `*-page-client.tsx`
- All forms use `useForm<T>()` + zod + `ActionDialog`
- Destructive actions use `ConfirmDialog` (`@/components/shared/confirm-dialog`) — e.g. candidate/project delete, payroll run, deactivate
- Keyboard focus is handled globally in `app/globals.css` (`:where(button,a,[role="button"],input,select,textarea):focus-visible:not([data-slot])`) — don't add per-element `focus-visible` classes on bespoke controls
- Kanban drag-and-drop uses `useDraggable`/`useDroppable` from `@dnd-kit/core` (bare `id` attributes on DOM elements are insufficient) + `KeyboardSensor` with `sortableKeyboardCoordinates`
- Live dates: several modules used to hardcode "Feb 2025"; always compute `new Date()` client-side (see greeting-banner pattern)

<!-- BEGIN:nextjs-agent-rules -->
## Next.js 16

Read `node_modules/next/dist/docs/` before writing code — this version has breaking changes from your training data.
<!-- END:nextjs-agent-rules -->
