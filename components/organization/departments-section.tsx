import { ChevronRight, Ellipsis } from "lucide-react"

import { cn } from "@/lib/utils"

type Dept = {
  code: string
  name: string
  sub: string
  people: number
  teams: number
  open: number
  leadInit: string
  leadName: string
  leadRole: string
  iconBg: string
  iconText: string
}

const depts: Dept[] = [
  {
    code: "EN",
    name: "Engineering",
    sub: "Product & Platform",
    people: 284,
    teams: 6,
    open: 4,
    leadInit: "DO",
    leadName: "Daniel Okafor",
    leadRole: "VP Engineering",
    iconBg: "bg-[#64b6ac29]",
    iconText: "text-[#3e9488]",
  },
  {
    code: "DE",
    name: "Design",
    sub: "Brand & Product",
    people: 86,
    teams: 4,
    open: 2,
    leadInit: "SA",
    leadName: "Sofia Alvarez",
    leadRole: "Head of Design",
    iconBg: "bg-[#f4a2612e]",
    iconText: "text-[#b96a2c]",
  },
  {
    code: "PR",
    name: "Product",
    sub: "Strategy & Ops",
    people: 124,
    teams: 5,
    open: 3,
    leadInit: "HL",
    leadName: "Hana Lindqvist",
    leadRole: "VP Product",
    iconBg: "bg-[#2f6f611a]",
    iconText: "text-[#2f6f61]",
  },
  {
    code: "SA",
    name: "Sales",
    sub: "Revenue & GTM",
    people: 142,
    teams: 5,
    open: 8,
    leadInit: "MB",
    leadName: "Marcus Bailey",
    leadRole: "VP Sales",
    iconBg: "bg-[#3bb27326]",
    iconText: "text-[#2e9160]",
  },
  {
    code: "MK",
    name: "Marketing",
    sub: "Brand & Growth",
    people: 68,
    teams: 3,
    open: 1,
    leadInit: "TV",
    leadName: "Tomas Vidal",
    leadRole: "VP Marketing",
    iconBg: "bg-[#e76f5124]",
    iconText: "text-[#cc5b3f]",
  },
  {
    code: "PE",
    name: "People",
    sub: "Talent & Culture",
    people: 42,
    teams: 2,
    open: 1,
    leadInit: "LF",
    leadName: "Lena Fischer",
    leadRole: "Director of People",
    iconBg: "bg-[#7ba88c29]",
    iconText: "text-[#548468]",
  },
  {
    code: "RE",
    name: "Research",
    sub: "Insights & Data",
    people: 38,
    teams: 2,
    open: 1,
    leadInit: "AC",
    leadName: "Amara Cole",
    leadRole: "Head of Research",
    iconBg: "bg-[#64b6ac29]",
    iconText: "text-[#3e9488]",
  },
  {
    code: "FI",
    name: "Finance",
    sub: "Accounting & FP&A",
    people: 56,
    teams: 2,
    open: 0,
    leadInit: "NK",
    leadName: "Nadia Khan",
    leadRole: "CFO",
    iconBg: "bg-[#2f6f611a]",
    iconText: "text-[#2f6f61]",
  },
]

export function DepartmentsSection() {
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-lg font-semibold leading-normal text-[#1f2a26]">
            Departments
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            14 departments · 38 teams
          </p>
        </div>
        <button type="button" className="flex items-center gap-1.5">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#2f6f61]">
            View all
          </span>
          <ChevronRight className="size-[15px] text-[#2f6f61]" strokeWidth={2} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {depts.map((dept) => (
          <DeptCard key={dept.code} dept={dept} />
        ))}
      </div>
    </section>
  )
}

function DeptCard({ dept }: { dept: Dept }) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-[#edeae3] bg-white p-5 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-[42px] items-center justify-center rounded-xl",
              dept.iconBg,
            )}
          >
            <span
              className={cn(
                "font-sans text-[13px] font-bold leading-normal",
                dept.iconText,
              )}
            >
              {dept.code}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-sans inline-block text-[14.5px] font-semibold leading-normal text-[#1f2a26]">
              {dept.name}
            </span>
            <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
              {dept.sub}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label={`More options for ${dept.name}`}
          className="text-[#b0b7af]"
        >
          <Ellipsis className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className="flex items-center gap-5">
        <Stat value={String(dept.people)} label="People" />
        <Stat value={String(dept.teams)} label="Teams" />
        <Stat
          value={String(dept.open)}
          label="Open"
          valueClass="text-[#b96a2c]"
        />
      </div>
      <div className="flex items-center gap-2.5 border-t border-t-[#f1eee8] px-0 pb-0 pt-3">
        <div className="flex size-[30px] items-center justify-center rounded-full bg-[#2f6f611f]">
          <span className="font-sans text-[11px] font-bold leading-normal text-[#2f6f61]">
            {dept.leadInit}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-[#42504a]">
            {dept.leadName}
          </span>
          <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
            {dept.leadRole}
          </span>
        </div>
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  valueClass,
}: {
  value: string
  label: string
  valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "font-sans text-base font-bold text-[#1f2a26]",
          valueClass,
        )}
      >
        {value}
      </span>
      <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
        {label}
      </span>
    </div>
  )
}
