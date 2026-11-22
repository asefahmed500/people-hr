import * as React from "react"
import { Filter } from "lucide-react"
import type { Review } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type DepartmentFilterBarProps = {
  activeDept: string
  onDeptChange: (dept: string) => void
  reviews?: Review[]
}

const deptMeta: Record<string, { dot: string; label: string }> = {
  engineering: { dot: "bg-foreground", label: "Engineering" },
  design: { dot: "bg-foreground", label: "Design" },
  product: { dot: "bg-secondary-foreground/40", label: "Product" },
  people: { dot: "bg-foreground", label: "People" },
  marketing: { dot: "bg-muted-foreground", label: "Marketing" },
  sales: { dot: "bg-foreground", label: "Sales" },
  research: { dot: "bg-secondary-foreground", label: "Research" },
  finance: { dot: "bg-primary", label: "Finance" },
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
    <div className="flex w-full flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex shrink-0 items-center gap-2 py-0 pl-0 pr-2">
        <Filter className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
        <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-secondary-foreground">
          Department
        </span>
      </div>
      <Separator orientation="vertical" className="h-6" />
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
      <Button
        type="button"
        onClick={onClick}
        className="h-auto shrink-0 gap-2 rounded-lg px-3.5 py-1.5"
      >
        <span className="font-sans inline-block text-[12.5px] font-medium leading-normal">
          {chip.label}
        </span>
        <span className="font-sans inline-block text-[11.5px] font-medium leading-normal opacity-80">
          {chip.count}
        </span>
      </Button>
    )
  }
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-auto shrink-0 gap-2 rounded-lg px-3.5 py-1.5 text-secondary-foreground"
    >
      {chip.dot ? <span className={`size-2.5 shrink-0 rounded-full ${chip.dot}`} aria-hidden="true" /> : null}
      <span className="font-sans inline-block text-[12.5px] font-medium leading-normal">
        {chip.label}
      </span>
      <span className="font-sans inline-block text-[11.5px] font-medium leading-normal text-muted-foreground">
        {chip.count}
      </span>
    </Button>
  )
}
