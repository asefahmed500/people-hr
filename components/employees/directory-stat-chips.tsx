import type { Employee } from "@/lib/data"

type Chip = {
  value: number
  label: string
  dot: string
  predicate?: (e: Employee) => boolean
}

export function DirectoryStatChips({ employees }: { employees: Employee[] }) {
  const chips: Chip[] = [
    { value: employees.length, label: "Total", dot: "bg-[#2f6f61]", predicate: () => true },
    { value: employees.filter((e) => e.status === "active").length, label: "Active", dot: "bg-[#3bb273]" },
    { value: employees.filter((e) => e.status === "leave").length, label: "On leave", dot: "bg-[#f4a261]" },
    { value: employees.filter((e) => e.hiredDaysAgo <= 7).length, label: "New this month", dot: "bg-[#64b6ac]" },
    { value: employees.filter((e) => e.status === "remote").length, label: "Remote", dot: "bg-[#7ba88c]" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="flex items-center gap-3.5 rounded-2xl border border-[#edeae3] bg-white px-5 py-3.5 shadow-sm"
        >
          <span className={`size-2.5 shrink-0 rounded-full ${chip.dot}`} />
          <div className="flex flex-col">
            <span className="font-sans inline-block text-lg font-semibold leading-tight text-[#1f2a26]">
              {chip.value}
            </span>
            <span className="font-sans inline-block text-[12.5px] leading-normal text-[#6b7770]">
              {chip.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
