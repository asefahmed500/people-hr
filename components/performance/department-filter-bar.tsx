import * as React from "react"
import { cn } from "@/lib/utils"
import { Filter } from "lucide-react"
import type { Review } from "@/lib/data"

type DepartmentFilterBarProps = {
  activeDept: string
  onDeptChange: (dept: string) => void
  reviews?: Review[]
}

const deptMeta: Record<string, { dot: string; label: string }> = {
  engineering: { dot: "bg-[#845ef7]", label: "Engineering" },
  design: { dot: "bg-[#6d5ce7]", label: "Design" },
  product: { dot: "bg-[#b197fc]", label: "Product" },
  people: { dot: "bg-[#5f3dc4]", label: "People" },
  marketing: { dot: "bg-[#f4a261]", label: "Marketing" },
  sales: { dot: "bg-[#e76f51]", label: "Sales" },
  research: { dot: "bg-[#64b6ac]", label: "Research" },
  finance: { dot: "bg-[#2f6f61]", label: "Finance" },
}

export function DepartmentFilterBar({ activeDept, onDeptChange, reviews = [] }: DepartmentFilterBarProps) {
  const deptCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    reviews.forEach((r) => {
      const key = r.department.toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [reviews])

  const chips = React.useMemo(() => {
    const total = reviews.length
    const result: { dot?: string; label: string; count: string; key: string }[] = [
      { label: "All teams", count: String(total), key: "all" },
    ]
    for (const [deptKey, meta] of Object.entries(deptMeta)) {
      const count = deptCounts[deptKey] || 0
      result.push({ dot: meta.dot, label: meta.label, count: String(count), key: deptKey })
    }
    return result
  }, [deptCounts, reviews.length])

  return (
    <div className="flex w-full flex-wrap items-center gap-3 rounded-[14px] border border-[#e8ebe6] bg-white px-4 py-3 shadow-[0px_2px_10px_rgba(109,92,231,0.03)]">
      <div className="flex shrink-0 items-center gap-2 pl-0 pr-2 py-0">
        <Filter className="size-[15px] shrink-0 text-[#8a948d]" strokeWidth={2} />
        <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-[#5b655e]">
          Department
        </span>
      </div>
      <span className="flex h-6 w-px shrink-0 flex-col bg-[#ece9e2]" />
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <Chip
            key={chip.key}
            chip={chip}
            isActive={activeDept === chip.key}
            onClick={() => onDeptChange(chip.key)}
          />
        ))}
      </div>
    </div>
  )
}

type ChipItem = { dot?: string; label: string; count: string; key: string }

function Chip({
  chip,
  isActive,
  onClick,
}: {
  chip: ChipItem
  isActive: boolean
  onClick: () => void
}) {
  if (isActive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex shrink-0 items-center gap-2 rounded-full bg-[#6d5ce7] px-3.5 py-1.5"
      >
        <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-white">
          {chip.label}
        </span>
        <span className="font-sans inline-block text-[11.5px] font-medium leading-normal text-[#ffffffcc]">
          {chip.count}
        </span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border border-[#e8ebe6] bg-white px-3.5 py-1.5",
      )}
    >
      {chip.dot ? <span className={`size-2.5 shrink-0 rounded-full ${chip.dot}`} /> : null}
      <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-[#5b655e]">
        {chip.label}
      </span>
      <span className="font-sans inline-block text-[11.5px] font-medium leading-normal text-[#a6aca3]">
        {chip.count}
      </span>
    </button>
  )
}
