"use client"

import * as React from "react"
import { ChevronDown, Search, Trash2, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Review, ReviewStatus } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusStyles: Record<ReviewStatus, { variant: "secondary" | "outline" | "destructive"; label: string }> = {
  exceeds: { variant: "secondary", label: "Exceeds" },
  meets: { variant: "secondary", label: "Meets" },
  below: { variant: "outline", label: "Below" },
  needs: { variant: "destructive", label: "Needs improvement" },
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
    <div id="employee-performance" className="flex w-full flex-col overflow-clip rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Employee performance
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Individual reviews across all departments
          </span>
        </div>
        <div className="flex w-full items-center gap-2.5 sm:w-auto sm:shrink-0">
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-muted px-3 sm:w-[220px] sm:flex-none">
            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search employees"
              aria-label="Search employees"
              className="flex-1 bg-transparent font-sans text-[12.5px] leading-normal text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={cycleSort}
            aria-label="Sort by rating"
            className="text-[12.5px] font-medium"
          >
            {sortDir === "high"
              ? "Rating: High to low"
              : sortDir === "low"
                ? "Rating: Low to high"
                : "Sort by rating"}
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-y border-border bg-muted py-8 text-center">
          <Users className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
          <p className="font-sans text-[13px] font-semibold text-foreground">No employees match your filter</p>
          <p className="font-sans text-[12px] text-muted-foreground">Try a different search or department.</p>
        </div>
      ) : (
        <Table className="min-w-[720px]">
          <TableCaption className="sr-only">Employee performance reviews</TableCaption>
          <TableHeader>
            <TableRow className="border-y border-border bg-muted hover:bg-muted">
              <TableHead className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">Employee</TableHead>
              <TableHead className="w-[120px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">Department</TableHead>
              <TableHead className="w-[130px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">Reviewer</TableHead>
              <TableHead className="w-[54px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">Rating</TableHead>
              <TableHead className="w-[150px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">Status</TableHead>
              <TableHead className="w-[40px]"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((emp, idx) => (
              <EmployeeRow key={emp.id} emp={emp} first={idx === 0} onDelete={onDelete} />
            ))}
          </TableBody>
        </Table>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-t-border px-4 py-3 sm:px-4">
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
    <TableRow className={cn("group border-b-0", !first && "border-t border-t-border")}>
      <TableCell className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs font-semibold">{emp.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="font-sans inline-block text-[13.5px] font-semibold leading-tight text-foreground">
              {emp.name}
            </span>
            <span className="font-sans inline-block text-[11.5px] leading-tight text-muted-foreground">
              {emp.role}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 shrink-0 rounded-full ${emp.deptDot}`} aria-hidden="true" />
          <span className="font-sans inline-block text-[12.5px] leading-normal text-secondary-foreground">
            {emp.department}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 font-sans text-[12.5px] leading-normal text-muted-foreground">
        {emp.reviewer}
      </TableCell>
      <TableCell className="px-4 py-3 text-lg font-semibold leading-normal text-foreground">
        {emp.rating.toFixed(1)}
      </TableCell>
      <TableCell className="px-4 py-3">
        <Badge variant={s.variant} className="text-[11.5px] font-semibold">
          {s.label}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 sm:group-hover:opacity-100"
            aria-label={`Delete review for ${emp.name}`}
            onClick={() => onDelete(emp)}
          >
            <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
