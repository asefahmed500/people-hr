import { Building2, MapPin, Network, Workflow, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Dept, Office } from "@/lib/data"

type Stat = {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  delta?: { text: string }
  deltaNeutral?: string
  value: string
  label: string
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
      delta: { text: `${peopleCount} people` },
      value: String(deptCount),
      label: "Departments",
    },
    {
      icon: Network,
      iconBg: "bg-foreground/20",
      iconColor: "text-secondary-foreground",
      delta: { text: `${deptCount} depts` },
      value: String(totalTeams),
      label: "Teams",
    },
    {
      icon: MapPin,
      iconBg: "bg-foreground/20",
      iconColor: "text-secondary-foreground",
      delta: { text: `${staffInOffices} staff` },
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
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <StatCard key={idx} stat={stat} />
      ))}
    </div>
  )
}

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-[42px] items-center justify-center rounded-lg",
            stat.iconBg,
          )}
        >
          <Icon className={cn("size-5", stat.iconColor)} strokeWidth={2} aria-hidden="true" />
        </div>
        {stat.delta ? (
          <Badge variant="secondary">{stat.delta.text}</Badge>
        ) : stat.deltaNeutral ? (
          <Badge variant="outline">{stat.deltaNeutral}</Badge>
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
