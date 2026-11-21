type Metric = {
  value: number
  label: string
  valueColor: string
}

export function LeaveKpiStrip({
  onLeaveToday,
  pending,
  approvedThisMonth,
  sickToday,
}: {
  onLeaveToday: number
  pending: number
  approvedThisMonth: number
  sickToday: number
}) {
  const metrics: Metric[] = [
    { value: onLeaveToday, label: "On leave today", valueColor: "text-secondary-foreground" },
    { value: pending, label: "Pending approval", valueColor: "text-secondary-foreground" },
    { value: approvedThisMonth, label: "Approved this month", valueColor: "text-secondary-foreground" },
    { value: sickToday, label: "Sick today", valueColor: "text-muted-foreground" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3"
        >
          <span
            className={`inline-block text-[28px] font-semibold leading-none ${metric.valueColor}`}
          >
            {metric.value}
          </span>
          <span className="font-sans inline-block text-[12px] leading-normal text-muted-foreground">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  )
}
