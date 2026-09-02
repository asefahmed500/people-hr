import * as React from "react"
import { ChevronRight, Ellipsis, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Dept } from "@/lib/data"

type DepartmentsSectionProps = {
  departments?: Dept[]
  onDeptAction?: (id: string, action: string) => void
}

const INITIAL_SHOW = 4

export function DepartmentsSection({ departments = [], onDeptAction }: DepartmentsSectionProps) {
  const [showAll, setShowAll] = React.useState(false)
  const visible = showAll ? departments : departments.slice(0, INITIAL_SHOW)

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Departments
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            {departments.length} departments · {departments.reduce((s, d) => s + d.teams, 0)} teams
          </p>
        </div>
        {departments.length > INITIAL_SHOW && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1.5"
          >
            <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-primary">
              {showAll ? "Show less" : "View all"}
            </span>
            <ChevronRight className={cn("size-[15px] text-primary transition-transform", showAll && "rotate-90")} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((dept) => (
          <DeptCard key={dept.id} dept={dept} onAction={onDeptAction} />
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
    <div ref={ref} className="relative flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
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
                "font-sans text-[13px] font-semibold leading-normal",
                dept.iconText,
              )}
            >
              {dept.code}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-sans inline-block text-[14.5px] font-semibold leading-normal text-foreground">
              {dept.name}
            </span>
            <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
              {dept.sub}
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label={`More options for ${dept.name}`}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && open) {
                e.stopPropagation()
                setOpen(false)
              }
            }}
            className="text-muted-foreground"
          >
            <Ellipsis className="size-4" strokeWidth={2} />
          </button>
          {open && (
            <div
              role="menu"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false)
              }}
              className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-border bg-card py-1 shadow-lg"
            >
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(dept.id, "view") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-secondary-foreground hover:bg-muted"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(dept.id, "edit") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-secondary-foreground hover:bg-muted"
              >
                Edit
              </button>
              <div className="mx-2 my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => { setOpen(false); onAction?.(dept.id, "delete") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-[13px] text-foreground hover:bg-muted"
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
          valueClass="text-secondary-foreground"
        />
      </div>
      <div className="flex items-center gap-2.5 border-t border-t-border px-0 pb-0 pt-3">
        <div className="flex size-[30px] items-center justify-center rounded-full bg-foreground/10">
          <span className="font-sans text-[11px] font-semibold leading-normal text-primary">
            {dept.leadInit}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-secondary-foreground">
            {dept.leadName}
          </span>
          <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
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
          "font-sans text-base font-semibold text-foreground",
          valueClass,
        )}
      >
        {value}
      </span>
      <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
