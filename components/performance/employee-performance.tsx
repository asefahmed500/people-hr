"use client"

import * as React from "react"
import { ChevronDown, Search, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Review, ReviewStatus } from "@/lib/data"

const statusStyles: Record<ReviewStatus, { bg: string; text: string; label: string }> = {
  exceeds: { bg: "bg-primary/10", text: "text-primary", label: "Exceeds" },
  meets: { bg: "bg-secondary-foreground/10", text: "text-secondary-foreground", label: "Meets" },
  below: { bg: "bg-muted-foreground/10", text: "text-muted-foreground", label: "Below" },
  needs: { bg: "bg-foreground/10", text: "text-foreground", label: "Needs improvement" },
}

type SortDir = "high" | "low" | null

type EmployeePerformanceProps = {
  filterDept?: string
  searchQuery?: string
  onSearchChange?: (q: string) => void
  reviews?: Review[]
  onDelete?: (review: Review) => void
}

export function EmployeePerformance({
  filterDept,
  searchQuery,
  onSearchChange,
  reviews = [],
  onDelete,
}: EmployeePerformanceProps) {
  const [sortDir, setSortDir] = React.useState<SortDir>(null)

  let filtered = reviews.filter((emp) => {
    if (filterDept && filterDept !== "all") {
      const deptKey = emp.department.toLowerCase().replace(/\s+/g, "-")
      if (deptKey !== filterDept) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !emp.name.toLowerCase().includes(q) &&
        !emp.department.toLowerCase().includes(q) &&
        !emp.role.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  if (sortDir) {
    filtered = [...filtered].sort((a, b) =>
      sortDir === "high" ? b.rating - a.rating : a.rating - b.rating,
    )
  }

  const cycleSort = () => {
    setSortDir((d) => (d === "high" ? "low" : d === "low" ? null : "high"))
  }

  return (
    <div id="employee-performance" className="flex w-full flex-col overflow-clip rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Employee performance
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Individual reviews across all departments
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-[220px] items-center gap-2 rounded-lg border border-border bg-muted px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search employees"
              className="flex-1 bg-transparent font-sans text-[12.5px] leading-normal text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={cycleSort}
            aria-label="Sort by rating"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="font-sans text-[12.5px] font-medium leading-normal text-secondary-foreground">
              {sortDir === "high"
                ? "Rating: High to low"
                : sortDir === "low"
                  ? "Rating: Low to high"
                  : "Sort by rating"}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 border-y border-border bg-muted px-6 py-2.5">
        <span className="min-w-0 flex-1 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Employee
        </span>
        <span className="w-[120px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Department
        </span>
        <span className="w-[130px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Reviewer
        </span>
        <span className="w-[54px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Rating
        </span>
        <span className="w-[150px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Status
        </span>
        <span className="w-[40px] shrink-0" />
      </div>
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <span className="font-sans text-[13px] leading-normal text-muted-foreground">
              No employees match your filter
            </span>
          </div>
        ) : (
          filtered.map((emp, idx) => (
            <EmployeeRow key={emp.id} emp={emp} first={idx === 0} onDelete={onDelete} />
          ))
        )}
      </div>
      <div className="flex items-center justify-between border-t border-t-border px-6 py-3.5">
        <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
          Showing {filtered.length} of {reviews.length} employees
        </span>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
          Average {filtered.length ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(2) : "—"}
        </span>
      </div>
    </div>
  )
}

function EmployeeRow({
  emp,
  first,
  onDelete,
}: {
  emp: Review
  first: boolean
  onDelete?: (review: Review) => void
}) {
  const s = statusStyles[emp.status]
  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-6 py-3.5",
        !first && "border-t border-t-border",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            emp.avatarBg,
          )}
        >
          <span className="font-sans text-xs font-semibold leading-normal text-background">
            {emp.initials}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-tight text-foreground">
            {emp.name}
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-tight text-muted-foreground">
            {emp.role}
          </span>
        </div>
      </div>
      <div className="flex w-[120px] shrink-0 items-center gap-2">
        <span className={`size-2.5 shrink-0 rounded-full ${emp.deptDot}`} />
        <span className="font-sans inline-block text-[12.5px] leading-normal text-secondary-foreground">
          {emp.department}
        </span>
      </div>
      <span className="w-[130px] shrink-0 font-sans text-[12.5px] leading-normal text-muted-foreground">
        {emp.reviewer}
      </span>
      <span className="w-[54px] shrink-0 text-lg font-semibold leading-normal text-foreground">
        {emp.rating.toFixed(1)}
      </span>
      <div className="flex w-[150px] shrink-0">
        <span
          className={cn(
            "flex items-center rounded-full px-2.5 py-1 font-sans text-[11.5px] font-semibold leading-normal",
            s.bg,
            s.text,
          )}
        >
          {s.label}
        </span>
      </div>
      <div className="flex w-[40px] shrink-0 justify-end">
        {onDelete ? (
          <button
            type="button"
            aria-label={`Delete review for ${emp.name}`}
            onClick={() => onDelete(emp)}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
