"use client"

import * as React from "react"
import { createStore, useStore, type StoreApi } from "zustand"

import { apiRequest, ApiError } from "@/lib/api-client"
import { notify } from "@/lib/toast"

type ApiState<T> = {
  state: T
  hydrated: boolean
  loading: boolean
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
    store.setState({
      hydrated: false,
      loading: false,
      saveTimer: null,
      version: null,
      writeSeq: 0,
      reverting: false,
    })
  }
}

/**
 * API-backed drop-in replacement for `useMockStore`.
 * Same shape: `{ state, setState, reset, hydrated }`.
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
} {
  const store = getStore<T>(endpoint, seed)

  const state = useStore(store, (s) => s.state)
  const hydrated = useStore(store, (s) => s.hydrated)

  React.useEffect(() => {
    const cur = store.getState()
    if (cur.hydrated || cur.loading) return
    store.setState({ loading: true })
    apiRequest<Response>(endpoint, { raw: true })
      .then((res) => {
        return res.json().then((data: T) => {
          store.setState({ state: data, hydrated: true, loading: false, version: versionOf(res) })
        })
      })
      .catch(() => {
        // Stay un-hydrated: the UI keeps its skeleton and any component
        // remount retries the fetch. Marking hydrated here would let seed
        // defaults be edited and PUT over real server data.
        store.setState({ hydrated: false, loading: false })
        notify.error("Couldn’t load", `Failed to load ${labelFor(endpoint)}.`)
      })
  }, [store, endpoint])

  const setState = React.useCallback(
    (updater: T | ((prev: T) => T)) => {
      const cur = store.getState()
      // Never mutate a store that hasn't loaded — the write would be based on
      // seed defaults and the PUT could clobber real server data.
      if (!cur.hydrated || cur.reverting) return
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

  return { state, setState, reset, refresh, hydrated }
}
