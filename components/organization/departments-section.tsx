import * as React from "react"
import { ChevronRight, Ellipsis, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Dept } from "@/lib/data"

type DepartmentsSectionProps = {
  departments?: Dept[]
  onViewAll?: () => void
  onDeptAction?: (id: string, action: string) => void
}

const INITIAL_SHOW = 4

export function DepartmentsSection({ departments = [], onViewAll, onDeptAction }: DepartmentsSectionProps) {
  const [showAll, setShowAll] = React.useState(false)
  const visible = showAll ? departments : departments.slice(0, INITIAL_SHOW)

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-lg font-semibold leading-normal text-[#1f2a26]">
            Departments
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            {departments.length} departments · {departments.reduce((s, d) => s + d.teams, 0)} teams
          </p>
        </div>
        {departments.length > INITIAL_SHOW && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1.5"
          >
            <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#2f6f61]">
              {showAll ? "Show less" : "View all"}
            </span>
            <ChevronRight className={cn("size-[15px] text-[#2f6f61] transition-transform", showAll && "rotate-90")} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {visible.map((dept) => (
          <DeptCard key={dept.code} dept={dept} onAction={onDeptAction} />
        ))}
      </div>
    </section>
  )
}

function DeptCard({ dept, onAction }: { dept: Dept; onAction?: (id: string, action: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative flex w-full flex-col gap-4 rounded-2xl border border-[#edeae3] bg-white p-5 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
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
        <div className="relative">
          <button
            type="button"
            aria-label={`More options for ${dept.name}`}
            onClick={() => setOpen((v) => !v)}
            className="text-[#b0b7af]"
          >
            <Ellipsis className="size-4" strokeWidth={2} />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-[#edeae3] bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(dept.code, "view") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-[#42504a] hover:bg-[#faf9f6]"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(dept.code, "edit") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-[#42504a] hover:bg-[#faf9f6]"
              >
                Edit
              </button>
              <div className="mx-2 my-1 h-px bg-[#edeae3]" />
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(dept.code, "delete") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-[#c4553a] hover:bg-[#faf9f6]"
              >
                <Trash2 className="size-3.5" strokeWidth={2} />
                Delete
              </button>
            </div>
          )}
        </div>
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
