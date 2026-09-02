import {
  Calendar,
  LayoutGrid,
  PieChart,
  Settings,
  Users,
} from "lucide-react"

const kpis = [
  { label: "Headcount", value: "248", delta: "+4 this month" },
  { label: "On leave today", value: "12", delta: "3 pending" },
  { label: "Approvals", value: "5", delta: "needs review" },
]

const bars = [
  { label: "M", height: "h-[70px]", fill: "bg-muted" },
  { label: "T", height: "h-[92px]", fill: "bg-secondary-foreground/30" },
  { label: "W", height: "h-[58px]", fill: "bg-muted" },
  { label: "T", height: "h-[104px]", fill: "bg-primary", labelClass: "text-secondary-foreground" },
  { label: "F", height: "h-[82px]", fill: "bg-secondary-foreground/30" },
  { label: "S", height: "h-[34px]", fill: "bg-muted" },
  { label: "S", height: "h-7", fill: "bg-muted" },
]

const activities = [
  { initials: "AC", name: "Ava Chen", action: "requested annual leave", status: "Pending" },
  { initials: "NK", name: "Noah Kim", action: "checked in at 09:02", status: "On time" },
  {
    initials: "PR",
    name: "Payroll",
    action: `${new Date().toLocaleDateString("en-US", { month: "long" })} run completed`,
    status: "Done",
  },
]

export function LandingDashboardShowcase() {
  return (
    <section className="flex w-full flex-col items-center gap-9 px-5 pb-[88px] pt-[72px] sm:px-10 lg:px-20">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-3 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[1.68px] text-primary">
          See it in action
        </p>
        <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[38px]">
          One calm home for your whole team
        </h2>
        <p className="font-sans text-base leading-[1.6] text-secondary-foreground">
          Headcount, attendance, approvals and payroll — live in a single,
          human dashboard.
        </p>
      </div>

      <div className="flex w-full max-w-[960px] flex-col overflow-clip rounded-2xl border border-border bg-card shadow-card">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-muted px-4">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-secondary-foreground/30" />
          <div className="ml-3 flex h-[22px] items-center rounded-full border border-border bg-card px-3">
            <span className="font-sans text-[11px] leading-normal text-muted-foreground">
              app.aetherpeople.com
            </span>
          </div>
        </div>

        <div className="flex">
          <div className="flex w-[58px] shrink-0 flex-col items-center gap-3 border-r border-border bg-muted py-4">
            <div className="flex size-[30px] items-center justify-center rounded-lg bg-foreground">
              <Users className="size-4 text-background" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-lg bg-foreground/10">
              <LayoutGrid className="size-[18px] text-primary" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-lg">
              <Users className="size-[18px] text-muted-foreground" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-lg">
              <Calendar className="size-[18px] text-muted-foreground" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-lg">
              <PieChart className="size-[18px] text-muted-foreground" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-lg">
              <Settings className="size-[18px] text-muted-foreground" strokeWidth={2} />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-h3">
                  Good morning, Maya
                </span>
                <span className="font-sans text-xs leading-normal text-muted-foreground">
                  Here&apos;s your team today
                </span>
              </div>
              <div className="flex h-[30px] items-center gap-1.5 rounded-lg border border-border bg-muted px-3">
                <Calendar className="size-3.5 text-secondary-foreground" strokeWidth={2} />
                <span className="font-sans text-xs font-medium leading-normal text-secondary-foreground">
                  This week
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="flex flex-1 flex-col gap-1 rounded-xl border border-border bg-card p-3"
                >
                  <span className="font-sans text-[11px] font-medium leading-normal text-muted-foreground">
                    {kpi.label}
                  </span>
                  <span className="text-stat">
                    {kpi.value}
                  </span>
                  <span className="font-sans text-[11px] font-medium leading-normal text-primary">
                    {kpi.delta}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[13px] font-semibold leading-normal text-foreground">
                  Attendance this week
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="font-sans text-[11px] leading-normal text-muted-foreground">
                    Present %
                  </span>
                </div>
              </div>
              <div className="flex h-[120px] items-end gap-2.5">
                {bars.map((bar, i) => (
                  <div
                    key={`${bar.label}-${i}`}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <div
                      className={`flex w-full flex-col rounded-tl-[5px] rounded-tr-[5px] ${bar.fill} ${bar.height}`}
                    />
                    <div
                      className={`font-sans text-[10px] leading-normal ${bar.labelClass ?? "text-muted-foreground"}`}
                    >
                      {bar.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <span className="font-sans text-[13px] font-semibold leading-normal text-foreground">
                Recent activity
              </span>
              {activities.map((row) => (
                <div key={row.initials} className="flex items-center gap-3">
                  <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-foreground/10">
                    <span className="font-sans text-[11px] font-semibold leading-normal text-primary">
                      {row.initials}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-sans text-[12.5px] font-semibold leading-normal text-foreground">
                      {row.name}
                    </span>
                    <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
                      {row.action}
                    </span>
                  </div>
                  <div className="flex h-[22px] items-center rounded-full border border-border bg-muted px-2.5">
                    <span className="font-sans text-[11px] font-medium leading-normal text-secondary-foreground">
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
