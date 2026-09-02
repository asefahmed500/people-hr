import type { ID, ProjectStatus } from "./types"

export type ProjectTask = {
  id: ID
  name: string
  ownerName: string
  ownerInit: string
  department: string
  progress: number
  dueOrShipped: string
  status: ProjectStatus
  tone: CardTone
  priority?: "low" | "medium" | "high"
}

export type CardTone = "green" | "amber" | "forest" | "mint" | "coral" | "slate"

export type ProjectsStore = {
  tasks: ProjectTask[]
}

export const statusColumns: {
  id: ProjectStatus
  title: string
  dot: string
  titleColor: string
  headerBg: string
  headerBorder: string
  countChipBg: string
  countChipText: string
}[] = [
  {
    id: "on-track",
    title: "On track",
    dot: "bg-primary",
    titleColor: "text-primary",
    headerBg: "bg-foreground/5",
    headerBorder: "border-foreground/10",
    countChipBg: "bg-foreground/10",
    countChipText: "text-primary",
  },
  {
    id: "at-risk",
    title: "At risk",
    dot: "bg-secondary-foreground",
    titleColor: "text-secondary-foreground",
    headerBg: "bg-foreground/5",
    headerBorder: "border-foreground/10",
    countChipBg: "bg-foreground/10",
    countChipText: "text-secondary-foreground",
  },
  {
    id: "delayed",
    title: "Delayed",
    dot: "bg-foreground",
    titleColor: "text-foreground",
    headerBg: "bg-foreground/5",
    headerBorder: "border-foreground/10",
    countChipBg: "bg-foreground/10",
    countChipText: "text-foreground",
  },
  {
    id: "on-hold",
    title: "On hold",
    dot: "bg-secondary-foreground",
    titleColor: "text-muted-foreground",
    headerBg: "bg-foreground/5",
    headerBorder: "border-foreground/10",
    countChipBg: "bg-foreground/10",
    countChipText: "text-muted-foreground",
  },
]

export const cardToneStyles: Record<CardTone, { avatarBg: string; avatarText: string }> = {
  green: { avatarBg: "bg-foreground/10", avatarText: "text-secondary-foreground" },
  amber: { avatarBg: "bg-foreground/20", avatarText: "text-secondary-foreground" },
  forest: { avatarBg: "bg-foreground/10", avatarText: "text-primary" },
  mint: { avatarBg: "bg-foreground/20", avatarText: "text-secondary-foreground" },
  coral: { avatarBg: "bg-foreground/20", avatarText: "text-foreground" },
  slate: { avatarBg: "bg-foreground/10", avatarText: "text-muted-foreground" },
}
export const defaultProjectsStore: ProjectsStore = {
  tasks: [],
}
