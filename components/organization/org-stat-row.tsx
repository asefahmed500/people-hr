import { Building2, MapPin, Network, Workflow, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Dept, Office } from "@/lib/data"

type Tone = "forest" | "mint" | "amber" | "green" | "neutral"

type Stat = {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  delta?: { text: string; tone: Exclude<Tone, "neutral"> }
  deltaNeutral?: string
  value: string
  label: string
}

const deltaTone: Record<Exclude<Tone, "neutral">, string> = {
  forest: "bg-foreground/10 text-secondary-foreground",
  mint: "bg-foreground/10 text-secondary-foreground",
  amber: "bg-foreground/10 text-secondary-foreground",
  green: "bg-foreground/10 text-secondary-foreground",
}

type OrgStatRowProps = {
  departments?: Dept[]
  offices?: Office[]
}

export function OrgStatRow({ departments = [], offices = [] }: OrgStatRowProps) {
  const deptCount = departments.length
  const totalTeams = departments.reduce((sum, d) => sum + d.teams, 0)
  const officeCount = offices.length
  const peopleCount = departments.reduce((sum, d) => sum + d.people, 0)
  const staffInOffices = offices.reduce((sum, o) => sum + o.count, 0)
  // "Reports per manager" = people ÷ managers, approximated by team leads
  // (sum of per-department team counts).
  const reportsPerManager =
    totalTeams > 0 ? (peopleCount / totalTeams).toFixed(1) : "0.0"

  const stats: Stat[] = [
    {
      icon: Building2,
      iconBg: "bg-foreground/10",
      iconColor: "text-primary",
      delta: { text: `${peopleCount} people`, tone: "green" },
      value: String(deptCount),
      label: "Departments",
    },
    {
      icon: Network,
      iconBg: "bg-foreground/20",
      iconColor: "text-secondary-foreground",
      delta: { text: `${deptCount} depts`, tone: "green" },
      value: String(totalTeams),
      label: "Teams",
    },
    {
      icon: MapPin,
      iconBg: "bg-foreground/20",
      iconColor: "text-secondary-foreground",
      delta: { text: `${staffInOffices} staff`, tone: "green" },
      value: String(officeCount),
      label: "Office locations",
    },
    {
      icon: Workflow,
      iconBg: "bg-foreground/10",
      iconColor: "text-secondary-foreground",
      deltaNeutral: "avg",
      value: reportsPerManager,
      label: "Reports per manager",
    },
  ]

  return (
    <div className="flex w-full gap-5">
      {stats.map((stat, idx) => (
        <StatCard key={idx} stat={stat} />
      ))}
    </div>
  )
}

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-[42px] items-center justify-center rounded-xl",
            stat.iconBg,
          )}
        >
          <Icon className={cn("size-5", stat.iconColor)} strokeWidth={2} />
        </div>
        {stat.delta ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-sans text-xs font-semibold leading-normal",
              deltaTone[stat.delta.tone],
            )}
          >
            {stat.delta.text}
          </span>
        ) : stat.deltaNeutral ? (
          <span className="rounded-full bg-muted px-2 py-0.5 font-sans text-xs font-semibold leading-normal text-muted-foreground">
            {stat.deltaNeutral}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-stat">
          {stat.value}
        </span>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
          {stat.label}
        </span>
      </div>
    </div>
  )
}
