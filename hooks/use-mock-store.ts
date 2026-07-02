"use client"

import * as React from "react"

type Versioned<T> = { v: number; data: T }

const CURRENT_V = 1

function read<T>(key: string, seed: () => T): T {
  if (typeof window === "undefined") return seed()
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      const fresh = seed()
      window.localStorage.setItem(key, JSON.stringify({ v: CURRENT_V, data: fresh } satisfies Versioned<T>))
      return fresh
    }
    const parsed = JSON.parse(raw) as Versioned<T>
    if (!parsed || typeof parsed !== "object" || parsed.v !== CURRENT_V) {
      const fresh = seed()
      window.localStorage.setItem(key, JSON.stringify({ v: CURRENT_V, data: fresh } satisfies Versioned<T>))
      return fresh
    }
    return parsed.data
  } catch {
    return seed()
  }
}

function write<T>(key: string, data: T) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: CURRENT_V, data } satisfies Versioned<T>))
  } catch {
    /* quota or private mode — swallow */
  }
}

export function useMockStore<T>(
  key: string,
  seed: () => T,
): {
  state: T
  setState: (updater: T | ((prev: T) => T)) => void
  reset: () => void
  hydrated: boolean
} {
  const [state, setState] = React.useState<T>(() => seed())
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setState(read(key, seed))
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = React.useCallback(
    (updater: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: T) => T)(prev)
            : updater
        write(key, next)
        return next
      })
    },
    [key],
  )

  const reset = React.useCallback(() => {
    const fresh = seed()
    write(key, fresh)
    setState(fresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { state, setState: update, reset, hydrated }
}
