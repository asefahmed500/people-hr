type LegendItem = {
  dot: string
  glow?: string
  label: string
  value: string
  valueClass?: string
}

const legend: LegendItem[] = [
  {
    dot: "bg-[#22b8cf]",
    glow: "shadow-[0px_0px_6px_rgb(34,184,207)]",
    label: "On-site Present",
    value: "1,024 · 80%",
  },
  {
    dot: "bg-[#1098ad]",
    label: "Remote Connected",
    value: "186 · 14%",
  },
  {
    dot: "bg-[#f4a261]",
    label: "On Approved Leave",
    value: "42 · 3%",
  },
  {
    dot: "bg-[#e76f51]",
    label: "Unexcused Absence",
    value: "32 · 2%",
    valueClass: "text-[#e76f51]",
  },
]

export function TodayStatusCard() {
  return (
    <div className="flex w-[380px] shrink-0 flex-col gap-5 rounded-[18px] border border-[#233549] bg-[#101826] p-6 shadow-xl">
      <h2 className="font-sans inline-block text-sm font-semibold text-[#eef2f7]">
        Today’s status
      </h2>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[#233549] bg-[#162235] p-4">
        <div className="flex items-center gap-2 rounded-full border border-[#22b8cf33] bg-[#22b8cf1a] px-3 py-1.5">
          <span className="size-2.5 rounded-full bg-[#22b8cf] shadow-[0px_0px_8px_rgb(34,184,207)]" />
          <span className="font-sans text-[11px] font-bold uppercase leading-normal tracking-[0.55px] text-[#22b8cf]">
            Live Control
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-display inline-block text-[28px] font-bold leading-none text-[#eef2f7]">
            1,210
          </span>
          <span className="font-sans inline-block text-[10px] uppercase leading-normal tracking-[0.5px] text-[#8a94a6]">
            Present Today
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 border-t border-t-[#233549] px-0 pb-0 pt-4">
        {legend.map((item) => (
          <div key={item.label} className="flex w-full items-center">
            <span
              className={`size-2 shrink-0 rounded-full ${item.dot} ${item.glow ?? ""}`}
            />
            <div className="mx-0 my-0 ml-2 flex flex-1 items-center justify-between">
              <span className="font-sans inline-block text-xs leading-normal text-[#8a94a6]">
                {item.label}
              </span>
              <span
                className={`font-sans text-xs font-semibold text-[#eef2f7] ${item.valueClass ?? ""}`}
              >
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
