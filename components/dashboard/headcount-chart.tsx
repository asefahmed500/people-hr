type Month = {
  label: string
  hires: number
  attrition: number
  current?: boolean
}

const months: Month[] = [
  { label: "Mar", hires: 70, attrition: 20 },
  { label: "Apr", hires: 88, attrition: 24 },
  { label: "May", hires: 80, attrition: 18 },
  { label: "Jun", hires: 100, attrition: 26 },
  { label: "Jul", hires: 94, attrition: 22 },
  { label: "Aug", hires: 116, attrition: 30 },
  { label: "Sep", hires: 108, attrition: 24 },
  { label: "Oct", hires: 128, attrition: 32 },
  { label: "Nov", hires: 122, attrition: 28 },
  { label: "Dec", hires: 140, attrition: 34 },
  { label: "Jan", hires: 134, attrition: 30 },
  { label: "Feb", hires: 150, attrition: 32, current: true },
]

export function HeadcountChart() {
  const max = Math.max(...months.map((m) => m.hires + m.attrition))
  return (
    <div className="relative flex flex-1 flex-col gap-5 rounded-[18px] border border-[#ece9e2] bg-white p-6 shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <Header />
      <Plot months={months} max={max} />
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-[3px]">
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
          Headcount growth
        </h3>
        <p className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
          Net additions over the last 12 months
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Legend color="bg-[#2f6f61]" label="Hires" />
        <Legend color="bg-[#dcebe4]" label="Attrition" />
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`size-[9px] rounded-[3px] ${color}`} />
      <span className="font-sans inline-block text-xs leading-normal text-[#6b7770]">
        {label}
      </span>
    </div>
  )
}

function Plot({ months, max }: { months: Month[]; max: number }) {
  return (
    <div className="flex h-[210px] items-end justify-between gap-2.5 border-b border-b-[#efede6] pb-0 pt-2.5">
      {months.map((m) => {
        const hireH = Math.round((m.hires / max) * 170)
        const attrH = Math.round((m.attrition / max) * 170)
        return (
          <div
            key={m.label}
            className="flex h-full flex-1 flex-col items-end justify-end gap-2"
          >
            <div className="flex w-full max-w-6 flex-col justify-end gap-[3px]">
              <div
                className="flex w-full flex-col rounded-tl-[5px] rounded-tr-[5px] bg-[#dcebe4]"
                style={{ height: `${attrH}px` }}
              />
              <div
                className={`flex w-full flex-col rounded-bl-[5px] rounded-br-[5px] ${
                  m.current ? "bg-[#2f6f61]" : "bg-[#2f6f61]"
                }`}
                style={{ height: `${hireH}px` }}
              />
            </div>
            <span
              className={`font-sans inline-block text-[10.5px] leading-normal ${
                m.current
                  ? "font-semibold text-[#2f6f61]"
                  : "text-[#a6aca3]"
              }`}
            >
              {m.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Footer() {
  return (
    <div className="flex items-center gap-6 pb-0 pt-0.5">
      <Stat value="+164" label="Net YTD" />
      <Stat value="91.4%" label="Retention" />
      <Stat value="3.2 yrs" label="Avg tenure" />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display inline-block text-[19px] font-semibold leading-normal text-[#1f2a26]">
        {value}
      </span>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
        {label}
      </span>
    </div>
  )
}
