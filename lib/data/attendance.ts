import type { ID } from "./types"

export type AttendanceStore = {
  checkIns: CheckIn[]
}

export type CheckIn = {
  id: ID
  initials: string
  name: string
  dept: string
  time: string
  status: "on-time" | "late" | "remote"
}

export const checkInStatusStyles: Record<
  CheckIn["status"],
  { pillBg: string; pillText: string; avatarBg: string; avatarText: string; label: string }
> = {
  "on-time": {
    pillBg: "bg-[#2e91601a]",
    pillText: "text-[#2e9160]",
    avatarBg: "bg-[#2f6f611a]",
    avatarText: "text-[#2f6f61]",
    label: "On time",
  },
  late: {
    pillBg: "bg-[#b96a2c1a]",
    pillText: "text-[#b96a2c]",
    avatarBg: "bg-[#b96a2c1a]",
    avatarText: "text-[#b96a2c]",
    label: "Late",
  },
  remote: {
    pillBg: "bg-[#3e94881a]",
    pillText: "text-[#3e9488]",
    avatarBg: "bg-[#3e94881a]",
    avatarText: "text-[#3e9488]",
    label: "Remote",
  },
}

export const defaultCheckIns: CheckIn[] = [
  { id: "ci-1", initials: "SA", name: "Sofia Alvarez", dept: "Design", time: "08:32", status: "on-time" },
  { id: "ci-2", initials: "DO", name: "Daniel Okafor", dept: "Engineering", time: "08:45", status: "on-time" },
  { id: "ci-3", initials: "MB", name: "Marcus Bailey", dept: "Sales", time: "09:14", status: "late" },
  { id: "ci-4", initials: "PN", name: "Priya Nair", dept: "Engineering", time: "08:05", status: "remote" },
  { id: "ci-5", initials: "LF", name: "Lena Fischer", dept: "People", time: "08:58", status: "on-time" },
  { id: "ci-6", initials: "HL", name: "Hana Lindqvist", dept: "Product", time: "09:22", status: "late" },
]

export type DeptHeatTile = {
  dept: string
  pct: string
  tileBg: string
  pctColor: string
}

export const defaultDeptHeat: DeptHeatTile[] = [
  { dept: "Engineering", pct: "96%", tileBg: "bg-[#2f6f611a]", pctColor: "text-[#2f6f61]" },
  { dept: "Design", pct: "89%", tileBg: "bg-[#f4a26126]", pctColor: "text-[#b96a2c]" },
  { dept: "Product", pct: "94%", tileBg: "bg-[#3bb27326]", pctColor: "text-[#2e9160]" },
  { dept: "Sales", pct: "92%", tileBg: "bg-[#3bb27326]", pctColor: "text-[#2e9160]" },
  { dept: "Marketing", pct: "95%", tileBg: "bg-[#3bb27326]", pctColor: "text-[#2e9160]" },
  { dept: "People", pct: "98%", tileBg: "bg-[#2f6f611a]", pctColor: "text-[#2f6f61]" },
]
