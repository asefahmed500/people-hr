const stats = [
  { value: "2,400+", label: "teams onboarded" },
  { value: "98.7%", label: "payroll accuracy" },
  { value: "6 hrs", label: "saved per week, per lead" },
  { value: "47", label: "countries supported" },
]

export function LandingStatsBand() {
  return (
    <section className="mx-5 my-[72px] sm:mx-10 lg:mx-20">
      <div className="flex w-full flex-col gap-6 rounded-[28px] bg-foreground px-8 py-[52px] shadow-card sm:gap-6 md:flex-row md:px-14">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className={`flex flex-1 flex-col gap-1.5 ${idx === 0 ? "" : "md:border-l md:border-background/15 md:pl-6"}`}
          >
            <span className="text-h1 text-background">
              {stat.value}
            </span>
            <span className="font-sans text-sm text-background/70">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
