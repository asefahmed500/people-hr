<!-- This file is auto-maintained by OpenCode. Do not add content that can be read from code. -->

# AetherPeople HR Dashboard

**This is NOT a Sales Commission system.** It's an **HR dashboard** — pure frontend, no backend.

## Architecture

- **Next.js 16 App Router** — check `node_modules/next/dist/docs/` before writing code (breaking changes possible)
- **No `src/`** — source lives at root: `app/`, `components/`, `lib/`, `hooks/`
- **Path alias:** `@/*` → `./*`
- **No API routes, no auth, no database** — all data is mock in `lib/data/*.ts`, persisted to `localStorage` via `useMockStore` hook

## Routes (15 pages)

All wrapped in `<DashboardShell activeHref={...} current={...}>` in their `page.tsx`:
`/` (Dashboard) · `/employees` · `/organization` · `/attendance` · `/leave` · `/recruitment` · `/onboarding` · `/projects` · `/performance` · `/goals` · `/payroll` · `/reports` · `/analytics` · `/assistant` · `/settings`

## State Pattern

```ts
const { state, setState, reset, hydrated } = useMockStore<T>(STORAGE_KEYS.x, () => defaultData)
```

- `hydrated` → `false` until localStorage is read. Show `<Skeleton>` before it's `true`.
- `setState(updater)` accepts function `(prev) => next`.
- Notification bell reads from `NotificationsStore` at `STORAGE_KEYS.notifications`.
  Every page action that creates a toast should also push a notification via `newNotification()` + `setState` on the notifs store.

## Key Imports

| Purpose | Import |
|---------|--------|
| Store key | `STORAGE_KEYS` from `@/lib/data` |
| Cmd+K action | `onAction(id => ...)` from `@/lib/command-actions` |
| Toast | `notify.success/info/error` from `@/lib/toast` |
| Class merge | `cn()` from `@/lib/utils` |
| Form dialog | `ActionDialog` (accepts `submitting` prop for loading state) from `@/components/shared/dialog-parts` |
| Table | `DataTable` from `@/components/shared/data-table` |
| Form fields | `Field`, `SelectField`, `TextArea`, `useForm` from `@/components/shared/field` |
| Confirm dialog | `ConfirmDialog` from `@/components/shared/confirm-dialog` |
| Empty state | `EmptyState` from `@/components/shared/empty-state` |
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
```

No tests. No CI.

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
- Kanban drag-and-drop uses `useDraggable`/`useDroppable` from `@dnd-kit/core` (bare `id` attributes on DOM elements are insufficient)

<!-- BEGIN:nextjs-agent-rules -->
## Next.js 16

Read `node_modules/next/dist/docs/` before writing code — this version has breaking changes from your training data.
<!-- END:nextjs-agent-rules -->
