import * as React from "react"
import { Building2, ChevronRight, Ellipsis, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Dept } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            className="gap-1.5"
          >
            {showAll ? "Show less" : "View all"}
            <ChevronRight className={cn("size-[15px] transition-transform", showAll && "rotate-90")} strokeWidth={2} aria-hidden="true" />
          </Button>
        )}
      </div>
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center">
          <Building2 className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
          <p className="font-sans text-[13px] font-semibold text-foreground">No departments yet</p>
          <p className="font-sans text-[12.5px] leading-normal text-muted-foreground">
            Add one to map your company structure.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((dept) => (
            <DeptCard key={dept.id} dept={dept} onAction={onDeptAction} />
          ))}
        </div>
      )}
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
    <div ref={ref} className="relative flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-[42px] items-center justify-center rounded-lg",
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
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
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
          >
            <Ellipsis className="size-4" strokeWidth={2} aria-hidden="true" />
          </Button>
          {open && (
            <div
              role="menu"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false)
              }}
              className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setOpen(false); onAction?.(dept.id, "view") }}
                className="w-full justify-start gap-2 rounded-none px-3 text-[13px] font-sans font-normal text-secondary-foreground"
              >
                View
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setOpen(false); onAction?.(dept.id, "edit") }}
                className="w-full justify-start gap-2 rounded-none px-3 text-[13px] font-sans font-normal text-secondary-foreground"
              >
                Edit
              </Button>
              <Separator className="mx-2 my-1" />
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setOpen(false); onAction?.(dept.id, "delete") }}
                className="w-full justify-start gap-2 rounded-none px-3 text-[13px] font-sans font-normal text-foreground"
              >
                <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Stat value={String(dept.people)} label="People" />
        <Stat value={String(dept.teams)} label="Teams" />
        <Stat
          value={String(dept.open)}
          label="Open"
          valueClass="text-secondary-foreground"
        />
      </div>
      <div className="flex items-center gap-2.5 border-t border-t-border px-0 pb-0 pt-3">
        <Avatar className="size-[30px]">
          <AvatarFallback className="text-[11px] font-semibold">{dept.leadInit}</AvatarFallback>
        </Avatar>
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
