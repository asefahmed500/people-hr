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
    dot: "bg-[#2f6fd0]",
    titleColor: "text-[#2f6fd0]",
    headerBg: "bg-[#2f6fd00d]",
    headerBorder: "border-[#2f6fd01a]",
    countChipBg: "bg-[#2f6fd01f]",
    countChipText: "text-[#2f6fd0]",
  },
  {
    id: "at-risk",
    title: "At risk",
    dot: "bg-[#d98a2b]",
    titleColor: "text-[#d98a2b]",
    headerBg: "bg-[#d98a2b0d]",
    headerBorder: "border-[#d98a2b1a]",
    countChipBg: "bg-[#d98a2b1f]",
    countChipText: "text-[#d98a2b]",
  },
  {
    id: "delayed",
    title: "Delayed",
    dot: "bg-[#d0553f]",
    titleColor: "text-[#d0553f]",
    headerBg: "bg-[#d0553f0d]",
    headerBorder: "border-[#d0553f1a]",
    countChipBg: "bg-[#d0553f1f]",
    countChipText: "text-[#d0553f]",
  },
  {
    id: "on-hold",
    title: "On hold",
    dot: "bg-[#8a948d]",
    titleColor: "text-[#8a948d]",
    headerBg: "bg-[#8a948d0d]",
    headerBorder: "border-[#8a948d1a]",
    countChipBg: "bg-[#8a948d1f]",
    countChipText: "text-[#8a948d]",
  },
]

export const cardToneStyles: Record<CardTone, { avatarBg: string; avatarText: string }> = {
  green: { avatarBg: "bg-[#3bb27326]", avatarText: "text-[#2e9160]" },
  amber: { avatarBg: "bg-[#f4a2612e]", avatarText: "text-[#b96a2c]" },
  forest: { avatarBg: "bg-[#2f6f611f]", avatarText: "text-[#2f6f61]" },
  mint: { avatarBg: "bg-[#64b6ac29]", avatarText: "text-[#3e9488]" },
  coral: { avatarBg: "bg-[#d0553f26]", avatarText: "text-[#b8462f]" },
  slate: { avatarBg: "bg-[#64748b26]", avatarText: "text-[#475569]" },
}

export const defaultProjectsStore: ProjectsStore = {
  tasks: [
    {
      id: "p-aurora",
      name: "Aurora Checkout",
      ownerName: "Sofia Alvarez",
      ownerInit: "AC",
      department: "Product",
      progress: 86,
      dueOrShipped: "Due Mar 14",
      status: "on-track",
      tone: "green",
    },
    {
      id: "p-pipeline",
      name: "Pipeline Launch",
      ownerName: "Marcus Bailey",
      ownerInit: "PL",
      department: "Sales",
      progress: 74,
      dueOrShipped: "Due Mar 03",
      status: "on-track",
      tone: "amber",
    },
    {
      id: "p-onboard",
      name: "Onboarding Revamp",
      ownerName: "Lena Fischer",
      ownerInit: "OR",
      department: "People",
      progress: 100,
      dueOrShipped: "✓ Shipped",
      status: "on-track",
      tone: "forest",
    },
    {
      id: "p-growth",
      name: "Growth Campaign",
      ownerName: "Hana Lindqvist",
      ownerInit: "GC",
      department: "Marketing",
      progress: 69,
      dueOrShipped: "Due Mar 21",
      status: "on-track",
      tone: "mint",
    },
    {
      id: "p-api",
      name: "API Gateway",
      ownerName: "Daniel Okafor",
      ownerInit: "AG",
      department: "Engineering",
      progress: 42,
      dueOrShipped: "Due Feb 28",
      status: "at-risk",
      tone: "amber",
    },
    {
      id: "p-data",
      name: "Data Platform",
      ownerName: "Priya Nair",
      ownerInit: "DP",
      department: "Engineering",
      progress: 28,
      dueOrShipped: "Was Feb 14",
      status: "delayed",
      tone: "coral",
    },
  ],
}
