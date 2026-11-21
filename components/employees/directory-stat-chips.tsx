import type { Employee } from "@/lib/data"

type Chip = {
  value: number
  label: string
  dot: string
}

export function DirectoryStatChips({ employees }: { employees: Employee[] }) {
  const chips: Chip[] = [
    { value: employees.length, label: "Total", dot: "bg-primary" },
    { value: employees.filter((e) => e.status === "active").length, label: "Active", dot: "bg-secondary-foreground" },
    { value: employees.filter((e) => e.status === "leave").length, label: "On leave", dot: "bg-muted-foreground" },
    { value: employees.filter((e) => e.hiredDaysAgo <= 30).length, label: "New this month", dot: "bg-secondary-foreground" },
    { value: employees.filter((e) => e.status === "remote").length, label: "Remote", dot: "bg-secondary-foreground" },
    { value: employees.filter((e) => e.status === "inactive").length, label: "Inactive", dot: "bg-muted-foreground" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <span className={`size-2.5 shrink-0 rounded-full ${chip.dot}`} aria-hidden="true" />
          <div className="flex flex-col">
            <span className="font-sans inline-block text-lg font-semibold leading-tight text-foreground">
              {chip.value}
            </span>
            <span className="font-sans inline-block text-[12.5px] leading-normal text-secondary-foreground">
              {chip.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
