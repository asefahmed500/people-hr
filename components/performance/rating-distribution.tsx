type Segment = {
  pct: number
  bg: string
}

type LegendItem = {
  swatch: string
  label: string
  count: string
}

const segments: Segment[] = [
  { pct: 24, bg: "bg-[#6d5ce7]" },
  { pct: 59, bg: "bg-[#a29bfe]" },
  { pct: 13, bg: "bg-[#f4a261]" },
  { pct: 4, bg: "bg-[#e76f51]" },
]

const legend: LegendItem[] = [
  { swatch: "bg-[#6d5ce7]", label: "Exceeds", count: "52 · 24%" },
  { swatch: "bg-[#a29bfe]", label: "Meets", count: "128 · 59%" },
  { swatch: "bg-[#f4a261]", label: "Below", count: "29 · 13%" },
  { swatch: "bg-[#e76f51]", label: "Needs improvement", count: "9 · 4%" },
]

export function RatingDistribution() {
  return (
    <div className="flex w-full flex-col gap-5 rounded-[18px] border border-[#e8ebe6] bg-white p-6 shadow-[0px_2px_10px_rgba(109,92,231,0.03)]">
      <div className="flex flex-col gap-1">
        <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
          Rating distribution
        </h2>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
          Q1 2025 · 218 reviews submitted across all teams
        </span>
      </div>
      <div className="flex h-3.5 w-full overflow-clip rounded-full">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className={`h-full ${seg.bg}`}
            style={{ width: `${seg.pct}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`size-3 shrink-0 rounded ${item.swatch}`} />
            <span className="font-sans inline-block text-[12.5px] font-medium leading-normal text-[#5b655e]">
              {item.label}
            </span>
            <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
