import { ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Review, ReviewStatus } from "@/lib/data"

const statusStyles: Record<ReviewStatus, { bg: string; text: string; label: string }> = {
  exceeds: { bg: "bg-[#6d5ce71a]", text: "text-[#6d5ce7]", label: "Exceeds" },
  meets: { bg: "bg-[#a29bfe22]", text: "text-[#5f3dc4]", label: "Meets" },
  below: { bg: "bg-[#f4a26122]", text: "text-[#b26a1f]", label: "Below" },
  needs: {
    bg: "bg-[#e76f5120]",
    text: "text-[#c4553a]",
    label: "Needs improvement",
  },
}

type EmployeePerformanceProps = {
  filterDept?: string
  searchQuery?: string
  onSearchChange?: (q: string) => void
  onViewAll?: () => void
  reviews?: Review[]
}

export function EmployeePerformance({
  filterDept,
  searchQuery,
  onSearchChange,
  onViewAll,
  reviews = [],
}: EmployeePerformanceProps) {
  const filtered = reviews.filter((emp) => {
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

  return (
    <div className="flex w-full flex-col overflow-clip rounded-[18px] border border-[#e8ebe6] bg-white shadow-[0px_2px_10px_rgba(109,92,231,0.03)]">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
            Employee performance
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            Individual reviews across all departments · Q1 2025
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-[220px] items-center gap-2 rounded-[10px] border border-[#e8ebe6] bg-[#faf9f6] px-3">
            <Search className="size-4 shrink-0 text-[#b0b7af]" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search employees"
              className="flex-1 bg-transparent font-sans text-[12.5px] leading-normal text-[#1f2a26] outline-none placeholder:text-[#a6aca3]"
            />
          </div>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8ebe6] bg-white px-3"
          >
            <span className="font-sans text-[12.5px] font-medium leading-normal text-[#42504a]">
              Rating: High to low
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-[#8a948d]" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 border-y border-y-[#f1eee8] bg-[#faf9f6] px-6 py-2.5">
        <span className="min-w-0 flex-1 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Employee
        </span>
        <span className="w-[120px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Department
        </span>
        <span className="w-[130px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Reviewer
        </span>
        <span className="w-[54px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Rating
        </span>
        <span className="w-[150px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Status
        </span>
      </div>
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <span className="font-sans text-[13px] leading-normal text-[#8a948d]">
              No employees match your filter
            </span>
          </div>
        ) : (
          filtered.map((emp, idx) => (
            <EmployeeRow key={emp.id} emp={emp} first={idx === 0} />
          ))
        )}
      </div>
      <div className="flex items-center justify-between border-t border-t-[#f1eee8] px-6 py-3.5">
        <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
          Showing {filtered.length} of {reviews.length} employees
        </span>
        <button type="button" onClick={onViewAll} className="flex items-center gap-1">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#6d5ce7]">
            View all employees
          </span>
          <ChevronDown
            className="size-3.5 shrink-0 rotate-[-90deg] text-[#6d5ce7]"
            strokeWidth={2}
          />
        </button>
      </div>
    </div>
  )
}

function EmployeeRow({ emp, first }: { emp: Review; first: boolean }) {
  const s = statusStyles[emp.status]
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-6 py-3.5",
        !first && "border-t border-t-[#f1eee8]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            emp.avatarBg,
          )}
        >
          <span className="font-sans text-xs font-semibold leading-normal text-white">
            {emp.initials}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-tight text-[#1f2a26]">
            {emp.name}
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-tight text-[#8a948d]">
            {emp.role}
          </span>
        </div>
      </div>
      <div className="flex w-[120px] shrink-0 items-center gap-2">
        <span className={`size-2.5 shrink-0 rounded-full ${emp.deptDot}`} />
        <span className="font-sans inline-block text-[12.5px] leading-normal text-[#5b655e]">
          {emp.department}
        </span>
      </div>
      <span className="w-[130px] shrink-0 font-sans text-[12.5px] leading-normal text-[#8a948d]">
        {emp.reviewer}
      </span>
      <span className="w-[54px] shrink-0 font-display text-lg font-semibold leading-normal text-[#1f2a26]">
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
    </div>
  )
}
