import { Info } from "lucide-react"

type Row = {
  label: string
  pct: number
  fill: string
}

const rows: Row[] = [
  { label: "Base salary", pct: 72, fill: "bg-[#2f6f61]" },
  { label: "Bonuses", pct: 11, fill: "bg-[#64b6ac]" },
  { label: "Benefits", pct: 10, fill: "bg-[#3bb273]" },
  { label: "Taxes", pct: 7, fill: "bg-[#f4a261]" },
]

export function PayBreakdown() {
  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-5 rounded-[18px] border border-[#edeae3] bg-white p-6 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex flex-col gap-1">
        <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
          Pay breakdown
        </h2>
        <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
          Gross pay composition
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-sans inline-block text-[13px] font-medium leading-normal text-[#42504a]">
                {row.label}
              </span>
              <span className="font-sans inline-block text-xs font-semibold leading-normal text-[#8a948d]">
                {row.pct}%
              </span>
            </div>
            <div className="flex h-1.5 w-full overflow-clip rounded-full bg-[#f1eee8]">
              <div
                className={`h-full rounded-full ${row.fill}`}
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 border-t border-t-[#f1eee8] px-0 pb-0 pt-1">
        <Info className="mx-0 mb-0 mt-px size-3.5 shrink-0 text-[#b0b7af]" strokeWidth={2} />
        <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
          Percentages reflect gross pay composition before employer taxes.
        </span>
      </div>
    </div>
  )
}
