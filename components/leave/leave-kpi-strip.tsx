type Metric = {
  value: string
  label: string
  valueColor: string
}

const metrics: Metric[] = [
  { value: "12", label: "On leave today", valueColor: "text-[#c14d6d]" },
  { value: "5", label: "Pending approval", valueColor: "text-[#d98a2b]" },
  { value: "38", label: "Approved in Feb", valueColor: "text-[#c14d6d]" },
  { value: "4", label: "Sick today", valueColor: "text-[#64748b]" },
]

export function LeaveKpiStrip() {
  return (
    <div className="flex rounded-[18px] border border-[#edeae3] bg-white px-2 py-0 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      {metrics.map((metric, idx) => (
        <div
          key={metric.label}
          className="flex flex-1 items-center gap-4 px-6 py-4"
        >
          <div className="flex flex-col gap-0.5">
            <span
              className={`font-display inline-block text-[26px] font-semibold leading-none ${metric.valueColor}`}
            >
              {metric.value}
            </span>
            <span className="mx-0 mb-0 mt-1 inline-block font-sans text-xs leading-normal text-[#8a948d]">
              {metric.label}
            </span>
          </div>
          {idx < metrics.length - 1 ? (
            <span className="mx-0 my-0 ml-auto flex w-px flex-col bg-[#edeae3]" />
          ) : null}
        </div>
      ))}
    </div>
  )
}
