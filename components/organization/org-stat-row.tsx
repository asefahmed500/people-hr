import { Building2, MapPin, Network, Workflow, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Dept, Office, OrgNode } from "@/lib/data"

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
  forest: "bg-[#3bb2731f] text-[#2e9160]",
  mint: "bg-[#3bb2731f] text-[#2e9160]",
  amber: "bg-[#f4a26129] text-[#c67934]",
  green: "bg-[#3bb2731f] text-[#2e9160]",
}

type OrgStatRowProps = {
  departments?: Dept[]
  offices?: Office[]
  orgChart?: OrgNode[]
}

export function OrgStatRow({ departments = [], offices = [], orgChart = [] }: OrgStatRowProps) {
  const deptCount = departments.length
  const totalTeams = departments.reduce((sum, d) => sum + d.teams, 0)
  const officeCount = offices.length

  const stats: Stat[] = [
    {
      icon: Building2,
      iconBg: "bg-[#2f6f611a]",
      iconColor: "text-[#2f6f61]",
      delta: { text: "+2", tone: "green" },
      value: String(deptCount),
      label: "Departments",
    },
    {
      icon: Network,
      iconBg: "bg-[#64b6ac29]",
      iconColor: "text-[#3e9488]",
      delta: { text: "+3", tone: "green" },
      value: String(totalTeams),
      label: "Teams",
    },
    {
      icon: MapPin,
      iconBg: "bg-[#f4a2612e]",
      iconColor: "text-[#b96a2c]",
      delta: { text: "+1", tone: "green" },
      value: String(officeCount),
      label: "Office locations",
    },
    {
      icon: Workflow,
      iconBg: "bg-[#3bb27326]",
      iconColor: "text-[#2e9160]",
      deltaNeutral: "avg",
      value: "8.4",
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
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-[#edeae3] bg-white p-5 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
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
          <span className="rounded-full bg-[#f1efea] px-2 py-0.5 font-sans text-xs font-semibold leading-normal text-[#8a948d]">
            {stat.deltaNeutral}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-display inline-block text-[28px] font-semibold leading-none text-[#1f2a26]">
          {stat.value}
        </span>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
          {stat.label}
        </span>
      </div>
    </div>
  )
}
