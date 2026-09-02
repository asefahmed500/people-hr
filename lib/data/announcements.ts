import type { ID } from "./types"

export type Announcement = {
  id: ID
  title: string
  body: string
  author: string
  /** Optional audience label, e.g. a department name or "All hands". */
  audience?: string
  pinned: boolean
  createdAt: number
}

export type AnnouncementsStore = {
  announcements: Announcement[]
}

export const defaultAnnouncementsStore: AnnouncementsStore = {
  announcements: [],
}
