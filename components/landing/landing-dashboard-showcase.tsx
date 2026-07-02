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
  { label: "M", height: "h-[70px]", fill: "bg-[#cfe3da]" },
  { label: "T", height: "h-[92px]", fill: "bg-[#a9d0c0]" },
  { label: "W", height: "h-[58px]", fill: "bg-[#cfe3da]" },
  { label: "T", height: "h-[104px]", fill: "bg-[#2f6f61]", labelClass: "text-[#42504a]" },
  { label: "F", height: "h-[82px]", fill: "bg-[#a9d0c0]" },
  { label: "S", height: "h-[34px]", fill: "bg-[#e5ece7]" },
  { label: "S", height: "h-7", fill: "bg-[#e5ece7]" },
]

const activities = [
  { initials: "AC", name: "Ava Chen", action: "requested annual leave", status: "Pending" },
  { initials: "NK", name: "Noah Kim", action: "checked in at 09:02", status: "On time" },
  { initials: "PR", name: "Payroll", action: "February run completed", status: "Done" },
]

export function LandingDashboardShowcase() {
  return (
    <section className="flex w-full flex-col items-center gap-9 px-5 pb-[88px] pt-[72px] sm:px-10 lg:px-20">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-3 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[1.68px] text-[#2f6f61]">
          See it in action
        </p>
        <h2 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.8px] text-[#1f2a26] sm:text-[38px]">
          One calm home for your whole team
        </h2>
        <p className="font-sans text-base leading-[1.6] text-[#5b655e]">
          Headcount, attendance, approvals and payroll — live in a single,
          human dashboard.
        </p>
      </div>

      <div className="flex w-full max-w-[960px] flex-col overflow-clip rounded-[18px] border border-[#ece9e2] bg-white shadow-[0px_30px_70px_rgba(47,111,97,0.18)]">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#ece9e2] bg-[#f6f4ef] px-4">
          <span className="size-2.5 rounded-full bg-[#e6a19a]" />
          <span className="size-2.5 rounded-full bg-[#e6c99a]" />
          <span className="size-2.5 rounded-full bg-[#9ac9b0]" />
          <div className="ml-3 flex h-[22px] items-center rounded-full border border-[#ece9e2] bg-white px-3">
            <span className="font-sans text-[11px] leading-normal text-[#8a948d]">
              app.aetherpeople.com
            </span>
          </div>
        </div>

        <div className="flex">
          <div className="flex w-[58px] shrink-0 flex-col items-center gap-3 border-r border-[#ece9e2] bg-[#f6f4ef] py-4">
            <div className="flex size-[30px] items-center justify-center rounded-[9px] bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(100,_182,_172)_100%)]">
              <Users className="size-4 text-white" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#2f6f611a]">
              <LayoutGrid className="size-[18px] text-[#2f6f61]" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-[10px]">
              <Users className="size-[18px] text-[#a7ada6]" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-[10px]">
              <Calendar className="size-[18px] text-[#a7ada6]" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-[10px]">
              <PieChart className="size-[18px] text-[#a7ada6]" strokeWidth={2} />
            </div>
            <div className="flex size-[34px] items-center justify-center rounded-[10px]">
              <Settings className="size-[18px] text-[#a7ada6]" strokeWidth={2} />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-[17px] font-semibold leading-normal text-[#1f2a26]">
                  Good morning, Maya
                </span>
                <span className="font-sans text-xs leading-normal text-[#8a948d]">
                  Here&apos;s your team today
                </span>
              </div>
              <div className="flex h-[30px] items-center gap-1.5 rounded-[9px] border border-[#ece9e2] bg-[#f6f4ef] px-3">
                <Calendar className="size-3.5 text-[#5b655e]" strokeWidth={2} />
                <span className="font-sans text-xs font-medium leading-normal text-[#42504a]">
                  This week
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="flex flex-1 flex-col gap-1 rounded-xl border border-[#ece9e2] bg-white p-3"
                >
                  <span className="font-sans text-[11px] font-medium leading-normal text-[#8a948d]">
                    {kpi.label}
                  </span>
                  <span className="font-display text-2xl font-semibold leading-none text-[#1f2a26]">
                    {kpi.value}
                  </span>
                  <span className="font-sans text-[11px] font-medium leading-normal text-[#2f6f61]">
                    {kpi.delta}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-[#ece9e2] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[13px] font-semibold leading-normal text-[#1f2a26]">
                  Attendance this week
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#2f6f61]" />
                  <span className="font-sans text-[11px] leading-normal text-[#8a948d]">
                    Present %
                  </span>
                </div>
              </div>
              <div className="flex h-[120px] items-end gap-2.5">
                {bars.map((bar) => (
                  <div
                    key={bar.label}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <div
                      className={`flex w-full flex-col rounded-tl-[5px] rounded-tr-[5px] ${bar.fill} ${bar.height}`}
                    />
                    <div
                      className={`font-sans text-[10px] leading-normal ${bar.labelClass ?? "text-[#a7ada6]"}`}
                    >
                      {bar.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-[#ece9e2] bg-white p-4">
              <span className="font-sans text-[13px] font-semibold leading-normal text-[#1f2a26]">
                Recent activity
              </span>
              {activities.map((row) => (
                <div key={row.initials} className="flex items-center gap-3">
                  <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#2f6f611a]">
                    <span className="font-sans text-[11px] font-semibold leading-normal text-[#2f6f61]">
                      {row.initials}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-sans text-[12.5px] font-semibold leading-normal text-[#1f2a26]">
                      {row.name}
                    </span>
                    <span className="font-sans text-[11.5px] leading-normal text-[#8a948d]">
                      {row.action}
                    </span>
                  </div>
                  <div className="flex h-[22px] items-center rounded-full border border-[#ece9e2] bg-[#f6f4ef] px-2.5">
                    <span className="font-sans text-[11px] font-medium leading-normal text-[#5b655e]">
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
