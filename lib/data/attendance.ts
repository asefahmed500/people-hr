import type { ID } from "./types"

export type AttendanceStore = {
  checkIns: CheckIn[]
}

export type CheckInStatus = "on-time" | "late" | "remote"

export type CheckIn = {
  id: ID
  initials: string
  name: string
  dept: string
  time: string
  status: CheckInStatus
  /** ISO date (YYYY-MM-DD) this check-in belongs to. */
  date?: string
}

export const checkInStatusStyles: Record<
  CheckIn["status"],
  { pillBg: string; pillText: string; avatarBg: string; avatarText: string; label: string }
> = {
  "on-time": {
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    avatarBg: "bg-foreground/10",
    avatarText: "text-primary",
    label: "On time",
  },
  late: {
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    avatarBg: "bg-foreground/10",
    avatarText: "text-secondary-foreground",
    label: "Late",
  },
  remote: {
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    avatarBg: "bg-foreground/10",
    avatarText: "text-secondary-foreground",
    label: "Remote",
  },
}

export const defaultCheckIns: CheckIn[] = []

export type DeptHeatTile = {
  dept: string
  pct: string
  tileBg: string
  pctColor: string
}

export const defaultDeptHeat: DeptHeatTile[] = []
