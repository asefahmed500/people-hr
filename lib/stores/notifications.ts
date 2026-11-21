"use client"

import { create } from "zustand"

import { apiRequest } from "@/lib/api-client"
import { type Notification } from "@/lib/data"

type NotificationsState = {
  items: Notification[]
  hydrated: boolean
  loading: boolean
  /** Notifications pushed before hydration — merged in once the GET resolves. */
  pending: Notification[]
  ensureLoaded: () => Promise<void>
  /** Re-fetch server notifications (used by the bell's live polling). */
  refresh: () => Promise<void>
  push: (input: Partial<Notification> & { title: string; description: string }) => void
  markRead: (id: string) => void
  markAllRead: () => void
  reset: () => void
}

function makeNotification(
  input: Partial<Notification> & { title: string; description: string },
): Notification {
  return {
    id: `n-${Math.random().toString(36).slice(2, 9)}`,
    type: "settings_changed",
    timestamp: new Date().toISOString().split("T")[0],
    read: false,
    ...input,
  }
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  hydrated: false,
  loading: false,
  pending: [],

  ensureLoaded: async () => {
    if (get().hydrated || get().loading) return
    set({ loading: true })
    try {
      const items = await apiRequest<Notification[]>("/api/notifications")
      // Merge any notifications pushed while we were still loading so they
      // aren't silently dropped by the blind server replace — but drop ones
      // the server already returned (their POST completed before this read),
      // otherwise they'd appear twice.
      const pending = get().pending
      const seen = new Set(items.map((n) => n.id))
      const fresh = pending.filter((n) => !seen.has(n.id))
      set({
        items: fresh.length ? [...fresh, ...items] : items,
        pending: [],
        hydrated: true,
        loading: false,
      })
    } catch {
      // Stay un-hydrated (pending intact) so the next ensureLoaded retries;
      // anything pushed meanwhile is already being persisted server-side.
      set({ loading: false })
    }
  },

  refresh: async () => {
    // Silent re-fetch for live polling. Keep locally-created pending rows that
    // the server hasn't returned yet, and preserve the read state of rows we
    // already showed so polling can't mark them unread again.
    if (get().loading) return
    set({ loading: true })
    try {
      const items = await apiRequest<Notification[]>("/api/notifications")
      const previous = get().items
      const readIds = new Set(previous.filter((n) => n.read).map((n) => n.id))
      const pending = get().pending
      const seen = new Set(items.map((n) => n.id))
      const fresh = pending.filter((n) => !seen.has(n.id))
      set({
        items: [...fresh, ...items.map((n) => (readIds.has(n.id) ? { ...n, read: true } : n))],
        pending: fresh,
        loading: false,
        hydrated: true,
      })
    } catch {
      set({ loading: false })
    }
  },

  push: (input) => {
    // Optimistic: add locally immediately, persist in the background.
    const notification = makeNotification(input)
    set((s) =>
      s.hydrated
        ? { items: [notification, ...s.items] }
        : { pending: [notification, ...s.pending] },
    )
    void apiRequest<Notification>("/api/notifications", {
      method: "POST",
      body: {
        type: notification.type,
        title: notification.title,
        description: notification.description,
        timestamp: notification.timestamp,
        href: notification.href,
      },
    })
      .then((created) => {
        // The server assigns the real id — swap it in (keeping any local read
        // flag) so markRead/markAllRead target a row that actually exists.
        set((s) => {
          const swap = (list: Notification[]) =>
            list.map((n) =>
              n.id === notification.id ? { ...created, read: n.read || created.read } : n,
            )
          return { items: swap(s.items), pending: swap(s.pending) }
        })
      })
      .catch(() => {})
  },

  markRead: (id) => {
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
    void apiRequest(`/api/notifications/${id}`, { method: "PATCH", body: { read: true } }).catch(
      () => {},
    )
  },

  markAllRead: () => {
    const unread = get().items.filter((n) => !n.read)
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }))
    for (const n of unread) {
      void apiRequest(`/api/notifications/${n.id}`, { method: "PATCH", body: { read: true } }).catch(
        () => {},
      )
    }
  },

  reset: () => {
    set({ items: [], pending: [], hydrated: false, loading: false })
  },
}))

// Fire-and-forget helper usable from any module (mirrors the old addNotification).
export function pushNotification(
  input: Partial<Notification> & { title: string; description: string },
) {
  useNotificationsStore.getState().push(input)
}
