import { ChevronRight } from "lucide-react"

const months = [
  { label: "Mar", value: 38 },
  { label: "Apr", value: 42 },
  { label: "May", value: 47 },
  { label: "Jun", value: 51 },
  { label: "Jul", value: 49 },
  { label: "Aug", value: 56 },
  { label: "Sep", value: 60 },
  { label: "Oct", value: 65 },
  { label: "Nov", value: 70 },
  { label: "Dec", value: 76 },
  { label: "Jan", value: 84 },
  { label: "Feb", value: 92, current: true },
]

const max = Math.max(...months.map((m) => m.value))

export function WorkforceTrendCard() {
  return (
    <div className="flex flex-1 flex-col gap-5 rounded-[18px] border border-[#e8ebe6] bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
            Workforce trend
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            Active headcount over the last 12 months
          </span>
        </div>
        <button type="button" className="flex items-center gap-1">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#2f6f61]">
            Open report
          </span>
          <ChevronRight className="size-3.5 text-[#2f6f61]" strokeWidth={2} />
        </button>
      </div>
      <div className="flex h-[200px] items-end justify-between gap-2.5 border-b border-b-[#efede6] pb-2.5">
        {months.map((m) => (
          <div
            key={m.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="flex w-full max-w-6 flex-col justify-end">
              <div
                className={
                  m.current
                    ? "w-full rounded-tl-[5px] rounded-tr-[5px] bg-[#2f6f61]"
                    : "w-full rounded-tl-[5px] rounded-tr-[5px] bg-[#64b6ac]"
                }
                style={{ height: `${Math.round((m.value / max) * 170)}px` }}
              />
            </div>
            <span
              className={
                m.current
                  ? "font-sans inline-block text-[10.5px] font-semibold leading-normal text-[#2f6f61]"
                  : "font-sans inline-block text-[10.5px] leading-normal text-[#a6aca3]"
              }
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <Stat value="284" label="Current" />
        <Stat value="+12" label="vs last month" tone="text-[#2e9160]" />
        <Stat value="164" label="Net additions 12mo" />
        <Stat value="13.8%" label="Growth" tone="text-[#2e9160]" />
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  tone,
}: {
  value: string
  label: string
  tone?: string
}) {
  return (
    <div className="flex flex-col">
      <span
        className={
          tone
            ? `font-display inline-block text-[19px] font-semibold leading-normal ${tone}`
            : "font-display inline-block text-[19px] font-semibold leading-normal text-[#1f2a26]"
        }
      >
        {value}
      </span>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
        {label}
      </span>
    </div>
  )
}
