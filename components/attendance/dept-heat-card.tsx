import { cn } from "@/lib/utils"

type Tile = {
  dept: string
  pct: string
  tileBg: string
  pctColor: string
}

const tiles: Tile[] = [
  {
    dept: "Engineering",
    pct: "96%",
    tileBg: "bg-[#2f6f611a]",
    pctColor: "text-[#2f6f61]",
  },
  {
    dept: "Design",
    pct: "89%",
    tileBg: "bg-[#f4a26126]",
    pctColor: "text-[#b96a2c]",
  },
  {
    dept: "Product",
    pct: "94%",
    tileBg: "bg-[#3bb27326]",
    pctColor: "text-[#2e9160]",
  },
  {
    dept: "Sales",
    pct: "92%",
    tileBg: "bg-[#3bb27326]",
    pctColor: "text-[#2e9160]",
  },
  {
    dept: "Marketing",
    pct: "95%",
    tileBg: "bg-[#3bb27326]",
    pctColor: "text-[#2e9160]",
  },
  {
    dept: "People",
    pct: "98%",
    tileBg: "bg-[#2f6f611a]",
    pctColor: "text-[#2f6f61]",
  },
]

export function DeptHeatCard() {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-6">
      <h2 className="font-sans inline-block text-sm font-semibold text-[#1f2a26]">
        Attendance by department
      </h2>
      <div className="flex flex-wrap gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.dept}
            className={cn(
              "flex min-w-[150px] flex-1 flex-col gap-1 rounded-xl p-4",
              tile.tileBg,
            )}
          >
            <span className="font-sans inline-block text-xs text-[#42504a]">
              {tile.dept}
            </span>
            <span
              className={cn(
                "font-display inline-block text-[28px] font-bold leading-tight",
                tile.pctColor,
              )}
            >
              {tile.pct}
            </span>
            <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
              attendance rate
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
