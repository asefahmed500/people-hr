import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  UserSearch,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type Tone = "forest" | "amber" | "coral"

type Kpi = {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: string
  label: string
  delta: string
  deltaTone: Tone
  deltaDirection: "up" | "down"
}

const kpis: Kpi[] = [
  {
    icon: Users,
    iconBg: "bg-[#2f6f611a]",
    iconColor: "text-[#2f6f61]",
    value: "1,284",
    label: "Total headcount",
    delta: "4.2%",
    deltaTone: "forest",
    deltaDirection: "up",
  },
  {
    icon: CalendarClock,
    iconBg: "bg-[#64b6ac24]",
    iconColor: "text-[#3e9488]",
    value: "94.2%",
    label: "Present today",
    delta: "1.1%",
    deltaTone: "forest",
    deltaDirection: "up",
  },
  {
    icon: UserSearch,
    iconBg: "bg-[#f4a26129]",
    iconColor: "text-[#d98842]",
    value: "27",
    label: "Open positions",
    delta: "6",
    deltaTone: "amber",
    deltaDirection: "up",
  },
  {
    icon: Wallet,
    iconBg: "bg-[#7ba88c29]",
    iconColor: "text-[#548468]",
    value: "$2.84M",
    label: "Payroll this month",
    delta: "0.8%",
    deltaTone: "coral",
    deltaDirection: "down",
  },
]

const deltaStyles: Record<Tone, { bg: string; icon: string; text: string }> = {
  forest: {
    bg: "bg-[#3bb2731f]",
    icon: "text-[#3bb273]",
    text: "text-[#2e9160]",
  },
  amber: {
    bg: "bg-[#f4a26129]",
    icon: "text-[#d98842]",
    text: "text-[#c67934]",
  },
  coral: {
    bg: "bg-[#e76f511f]",
    icon: "text-[#e76f51]",
    text: "text-[#cc5b3f]",
  },
}

export function KpiRow() {
  return (
    <div className="flex h-fit w-full gap-5">
      {kpis.map((kpi, idx) => (
        <KpiCard key={idx} kpi={kpi} />
      ))}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon
  const DeltaIcon = kpi.deltaDirection === "up" ? ArrowUpRight : ArrowDownRight
  const delta = deltaStyles[kpi.deltaTone]
  return (
    <div className="flex flex-1 flex-col gap-3.5 rounded-[18px] border border-[#ece9e2] bg-white p-5 shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-[38px] items-center justify-center rounded-[11px]",
            kpi.iconBg,
          )}
        >
          <Icon className={cn("size-[19px]", kpi.iconColor)} strokeWidth={2} />
        </div>
        <div
          className={cn(
            "flex items-center gap-[3px] rounded-full px-[7px] py-[3px]",
            delta.bg,
          )}
        >
          <DeltaIcon className={cn("size-3", delta.icon)} strokeWidth={2} />
          <span
            className={cn(
              "font-sans text-[11px] font-semibold leading-normal",
              delta.text,
            )}
          >
            {kpi.delta}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="font-display inline-block text-[28px] font-semibold leading-none text-[#1f2a26]">
          {kpi.value}
        </div>
        <div className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
          {kpi.label}
        </div>
      </div>
    </div>
  )
}
