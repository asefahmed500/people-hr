import { Filter } from "lucide-react"

type Chip = {
  dot?: string
  label: string
  count: string
  active?: boolean
}

const chips: Chip[] = [
  { label: "All teams", count: "284", active: true },
  { dot: "bg-[#845ef7]", label: "Engineering", count: "96" },
  { dot: "bg-[#6d5ce7]", label: "Design", count: "24" },
  { dot: "bg-[#b197fc]", label: "Product", count: "32" },
  { dot: "bg-[#5f3dc4]", label: "People", count: "18" },
  { dot: "bg-[#f4a261]", label: "Marketing", count: "40" },
  { dot: "bg-[#e76f51]", label: "Sales", count: "74" },
]

export function DepartmentFilterBar() {
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
          <Chip key={chip.label} chip={chip} />
        ))}
      </div>
    </div>
  )
}

function Chip({ chip }: { chip: Chip }) {
  if (chip.active) {
    return (
      <span className="flex shrink-0 items-center gap-2 rounded-full bg-[#6d5ce7] px-3.5 py-1.5">
        <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-white">
          {chip.label}
        </span>
        <span className="font-sans inline-block text-[11.5px] font-medium leading-normal text-[#ffffffcc]">
          {chip.count}
        </span>
      </span>
    )
  }
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border border-[#e8ebe6] bg-white px-3.5 py-1.5">
      {chip.dot ? <span className={`size-2.5 shrink-0 rounded-full ${chip.dot}`} /> : null}
      <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-[#5b655e]">
        {chip.label}
      </span>
      <span className="font-sans inline-block text-[11.5px] font-medium leading-normal text-[#a6aca3]">
        {chip.count}
      </span>
    </span>
  )
}
