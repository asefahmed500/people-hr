type Metric = {
  value: number
  label: string
  valueColor: string
}

export function LeaveKpiStrip({
  onLeaveToday,
  pending,
  approvedFeb,
  sickToday,
}: {
  onLeaveToday: number
  pending: number
  approvedFeb: number
  sickToday: number
}) {
  const metrics: Metric[] = [
    { value: onLeaveToday, label: "On leave today", valueColor: "text-[#c14d6d]" },
    { value: pending, label: "Pending approval", valueColor: "text-[#d98a2b]" },
    { value: approvedFeb, label: "Approved in Feb", valueColor: "text-[#c14d6d]" },
    { value: sickToday, label: "Sick today", valueColor: "text-[#64748b]" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex flex-col gap-1 rounded-[18px] border border-[#edeae3] bg-white px-5 py-4"
        >
          <span
            className={`font-display inline-block text-[28px] font-semibold leading-none ${metric.valueColor}`}
          >
            {metric.value}
          </span>
          <span className="font-sans inline-block text-[12px] leading-normal text-[#8a948d]">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  )
}
