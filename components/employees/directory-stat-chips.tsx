type Chip = {
  value: string
  label: string
  dot: string
}

const chips: Chip[] = [
  { value: "1,210", label: "Active", dot: "bg-[#3bb273]" },
  { value: "42", label: "On leave", dot: "bg-[#f4a261]" },
  { value: "18", label: "New this month", dot: "bg-[#64b6ac]" },
  { value: "96", label: "Contractors", dot: "bg-[#7ba88c]" },
]

export function DirectoryStatChips() {
  return (
    <div className="flex h-fit w-full shrink-0 items-center gap-4">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="flex flex-1 items-center gap-3.5 rounded-2xl border border-[#edeae3] bg-white px-5 py-3.5 shadow-sm"
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
