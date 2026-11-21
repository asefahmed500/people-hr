"use client"

import * as React from "react"
import { createStore, useStore, type StoreApi } from "zustand"

import { apiRequest, ApiError } from "@/lib/api-client"
import { notify } from "@/lib/toast"

type ApiState<T> = {
  state: T
  hydrated: boolean
  loading: boolean
  /** True only after every GET attempt failed — drives the retry UI. */
  error: boolean
  /** Bumped by retry() to re-run the hydration effect. */
  fetchNonce: number
  saveTimer: ReturnType<typeof setTimeout> | null
  version: number | null
  writeSeq: number
  reverting: boolean
}

// One vanilla store per endpoint, shared across every component that uses it.
const registry = new Map<string, StoreApi<ApiState<unknown>>>()

function getStore<T>(endpoint: string, seed: () => T): StoreApi<ApiState<T>> {
  const existing = registry.get(endpoint)
  if (existing) return existing as unknown as StoreApi<ApiState<T>>
  const store = createStore<ApiState<T>>()(() => ({
    state: seed(),
    hydrated: false,
    loading: false,
    error: false,
    fetchNonce: 0,
    saveTimer: null,
    version: null,
    writeSeq: 0,
    reverting: false,
  }))
  registry.set(endpoint, store as unknown as StoreApi<ApiState<unknown>>)
  return store
}

function labelFor(endpoint: string): string {
  const m = endpoint.split("/").filter(Boolean).pop()
  return m ? m.replace(/-/g, " ") : "data"
}

function versionOf(res: Response): number | null {
  const raw = res.headers.get("x-module-version")
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Drop hydration state on every store so the next mount re-fetches fresh data. */
export function resetAllStores() {
  for (const store of registry.values()) {
    // Cancel any in-flight debounced PUT before clearing its handle — logging
    // out must not let a pending edit fire with an expired session.
    const pending = store.getState().saveTimer
    if (pending) clearTimeout(pending)
    store.setState((s) => ({
      hydrated: false,
      loading: false,
      error: false,
      fetchNonce: s.fetchNonce + 1,
      saveTimer: null,
      version: null,
      writeSeq: 0,
      reverting: false,
    }))
  }
}

/**
 * Endpoints whose derived views depend on a write to the key endpoint. When a
 * write lands, these stores must re-fetch or the UI keeps showing stale counts
 * (analytics, headcount, leave status) for the rest of the SPA session.
 */
const RELATED_ENDPOINTS: Record<string, string[]> = {
  "/api/store/leave": ["employees", "analytics", "notifications"],
  "/api/store/employees": ["leave", "payroll", "payslips", "organization", "analytics", "performance", "projects", "goals", "attendance"],
  "/api/store/recruitment": ["employees", "leave", "onboarding", "analytics"],
  "/api/store/organization": ["analytics", "employees"],
  "/api/store/reports": ["notifications"],
  "/api/store/attendance": ["analytics"],
  "/api/store/projects": ["analytics"],
  "/api/store/goals": ["analytics"],
  "/api/store/performance": ["analytics"],
  "/api/store/onboarding": ["analytics"],
  "/api/store/payroll": ["payslips", "analytics"],
}

function invalidateRelatedStores(endpoint: string): void {
  const related = RELATED_ENDPOINTS[endpoint]
  for (const [key, store] of registry) {
    if (key === endpoint) continue
    const shouldRefresh = !related || related.some((name) => key.endsWith(`/${name}`))
    if (!shouldRefresh) continue
    const current = store.getState()
    if (!current.hydrated) continue
    // Mark unhydrated + bump nonce so mounted consumers re-fetch on the next
    // render; unmounted ones simply fetch when they next mount.
    store.setState({
      hydrated: false,
      loading: false,
      fetchNonce: current.fetchNonce + 1,
      version: null,
    })
  }
}

/**
 * API-backed drop-in replacement for `useMockStore`.
 * Same shape plus load feedback: `{ state, setState, reset, refresh, hydrated, error, retry }`.
 * - Hydrates from `GET ${endpoint}` on mount (once per endpoint).
 * - `setState` applies optimistically + schedules a debounced `PUT`.
 * - Writes are ignored until the store is hydrated, so an early cross-store
 *   action can never persist seed defaults over real server data.
 * - On PUT failure: toasts + re-fetches server truth (revert). A write
 *   sequence prevents a stale refetch from clobbering a newer edit.
 */
export function useApiStore<T>(
  endpoint: string,
  seed: () => T,
): {
  state: T
  setState: (updater: T | ((prev: T) => T)) => void
  reset: () => void
  /** Re-fetch server truth without scheduling a write (for out-of-band changes). */
  refresh: () => Promise<void>
  hydrated: boolean
  /** True only when all GET retries failed and the section could not load. */
  error: boolean
  /** Clear the failure and re-fetch this endpoint from the server. */
  retry: () => void
} {
  const store = getStore<T>(endpoint, seed)

  const state = useStore(store, (s) => s.state)
  const hydrated = useStore(store, (s) => s.hydrated)
  const error = useStore(store, (s) => s.error)
  const fetchNonce = useStore(store, (s) => s.fetchNonce)

  React.useEffect(() => {
    const cur = store.getState()
    if (cur.hydrated || cur.loading) return
    store.setState({ loading: true, error: false })
    let cancelled = false

    // Transient network/server blips should not strand the user on a permanent
    // skeleton. Retry a couple of times with backoff before surfacing the
    // failure; never mark hydrated on failure, so seed defaults can't be PUT
    // over real server data.
    const load = async (attempt: number): Promise<void> => {
      try {
        const res = await apiRequest<Response>(endpoint, { raw: true })
        const data = (await res.json()) as T
        if (cancelled) return
        store.setState({
          state: data,
          hydrated: true,
          loading: false,
          error: false,
          version: versionOf(res),
        })
      } catch {
        if (cancelled) return
        if (attempt < 2) {
          setTimeout(() => {
            if (!cancelled) void load(attempt + 1)
          }, 400 * (attempt + 1))
          return
        }
        // All attempts failed: surface a retryable error rather than leaving
        // the consumer stuck on a permanent skeleton.
        store.setState({ hydrated: false, loading: false, error: true })
        notify.error("Couldn’t load", `Failed to load ${labelFor(endpoint)}. Try again from the page.`)
      }
    }
    void load(0)
    return () => {
      cancelled = true
      // React StrictMode double-invokes effects in dev: the first run's
      // cleanup must release the loading lock so the second run can fetch.
      // Without this, every store-backed page stays on its skeleton forever
      // in development even though the GET would succeed.
      const latest = store.getState()
      if (latest.loading && !latest.hydrated) store.setState({ loading: false })
    }
  }, [store, endpoint, fetchNonce])

  const setState = React.useCallback(
    (updater: T | ((prev: T) => T)) => {
      const cur = store.getState()
      // Never mutate a store that hasn't loaded — the write would be based on
      // seed defaults and the PUT could clobber real server data.
      if (!cur.hydrated) return
      const next = typeof updater === "function" ? (updater as (p: T) => T)(cur.state) : updater
      const seq = cur.writeSeq + 1
      store.setState({ state: next, writeSeq: seq })

      if (cur.saveTimer) clearTimeout(cur.saveTimer)
      const timer = setTimeout(() => {
        store.setState({ saveTimer: null })
        const snap = store.getState()
        void apiRequest<Response>(endpoint, {
          method: "PUT",
          body: snap.state,
          raw: true,
          headers: snap.version !== null ? { "If-Match": String(snap.version) } : {},
        })
          .then((res) => {
            store.setState({ version: versionOf(res) })
            invalidateRelatedStores(endpoint)
          })
          .catch((err) => {
            const stale = err instanceof ApiError && err.status === 409
            notify.error(
              stale ? "Out of date" : "Couldn’t save",
              stale
                ? `${labelFor(endpoint)} changed elsewhere. Refreshing…`
                : `Reverting ${labelFor(endpoint)} to the last saved version.`,
            )
            // Re-fetch authoritative server state. Only apply it if the user
            // hasn't made a newer edit while the refetch was in flight.
            const fetchSeq = store.getState().writeSeq
            store.setState({ reverting: true })
            apiRequest<Response>(endpoint, { raw: true })
              .then((res) => {
                return res.json().then((data: T) => {
                  if (store.getState().writeSeq !== fetchSeq) {
                    // A newer local edit won — keep it and just refresh the version.
                    store.setState({ reverting: false, version: versionOf(res) })
                  } else {
                    store.setState({ state: data, reverting: false, version: versionOf(res) })
                  }
                })
              })
              .catch(() => store.setState({ reverting: false }))
          })
      }, 400)
      store.setState({ saveTimer: timer })
    },
    [store, endpoint],
  )

  // Server-side (or another tab's) writes bypass this hook — refresh() pulls
  // the authoritative document and re-syncs the concurrency version without
  // scheduling a PUT. Skipped while a local save is pending so an in-flight
  // edit can't be visually lost; that save's own sync path handles the merge.
  const refresh = React.useCallback(async () => {
    const cur = store.getState()
    if (!cur.hydrated || cur.reverting || cur.saveTimer) return
    try {
      const res = await apiRequest<Response>(endpoint, { raw: true })
      const data = (await res.json()) as T
      store.setState({ state: data, version: versionOf(res) })
    } catch {
      notify.error("Couldn’t refresh", `Failed to refresh ${labelFor(endpoint)}.`)
    }
  }, [store, endpoint])

  const reset = React.useCallback(() => {
    const cur = store.getState()
    // Resetting before hydration would write seed defaults over real data.
    if (!cur.hydrated || cur.reverting) return
    if (cur.saveTimer) clearTimeout(cur.saveTimer)
    const next = seed()
    store.setState({ state: next, saveTimer: null })
    void apiRequest<Response>(endpoint, { method: "PUT", body: next, raw: true })
      .then((res) => store.setState({ version: versionOf(res) }))
      .catch(() => {
        notify.error("Couldn’t reset", `Failed to reset ${labelFor(endpoint)}.`)
      })
  }, [store, endpoint, seed])

  // Wipe the failed hydration state and bump the nonce so the effect above
  // re-runs. Other mounted components sharing this store re-run too, but the
  // loading guard makes sure only one request is actually sent.
  const retry = React.useCallback(() => {
    store.setState((s) => ({
      loading: false,
      hydrated: false,
      error: false,
      fetchNonce: s.fetchNonce + 1,
    }))
  }, [store])

  return { state, setState, reset, refresh, hydrated, error, retry }
}
