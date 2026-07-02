const stats = [
  { value: "2,400+", label: "teams onboarded" },
  { value: "98.7%", label: "payroll accuracy" },
  { value: "6 hrs", label: "saved per week, per lead" },
  { value: "47", label: "countries supported" },
]

export function LandingStatsBand() {
  return (
    <section className="mx-5 my-[72px] sm:mx-10 lg:mx-20">
      <div className="flex w-full flex-col gap-6 rounded-[28px] bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(61,_133,_116)_55%,_rgb(100,_182,_172)_100%)] px-8 py-[52px] shadow-[0px_30px_60px_rgba(47,111,97,0.24)] sm:gap-6 md:flex-row md:px-14">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className={`flex flex-1 flex-col gap-1.5 ${idx === 0 ? "" : "md:border-l md:border-[#ffffff26] md:pl-6"}`}
          >
            <span className="font-display text-[36px] font-semibold leading-none text-white sm:text-[44px]">
              {stat.value}
            </span>
            <span className="font-sans text-sm text-[#ffffffb3]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
