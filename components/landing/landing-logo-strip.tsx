const logos = [
  "Northwind",
  "Lumen",
  "Fjord",
  "Basewell",
  "Corvid",
  "Meridian",
]

export function LandingLogoStrip() {
  return (
    <section className="flex w-full flex-col items-center gap-[22px] border-y border-[#ece9e2] bg-white px-5 py-9 sm:px-10 lg:px-20">
      <p className="font-sans text-xs font-semibold uppercase tracking-[1.68px] text-[#a7ada6]">
        Trusted by people teams at
      </p>
      <div className="flex w-full flex-wrap items-center justify-center gap-x-[52px] gap-y-4">
        {logos.map((logo) => (
          <span
            key={logo}
            className="font-display text-[22px] font-semibold leading-normal text-[#c2c7bf]"
          >
            {logo}
          </span>
        ))}
      </div>
    </section>
  )
}
