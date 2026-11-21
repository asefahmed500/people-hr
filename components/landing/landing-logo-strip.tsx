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
    <section className="flex w-full flex-col items-center gap-[22px] border-y border-border bg-background px-5 py-9 sm:px-10 lg:px-20">
      <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Trusted by people teams at
      </p>
      <div className="flex w-full flex-wrap items-center justify-center gap-x-[52px] gap-y-4">
        {logos.map((logo) => (
          <span
            key={logo}
            className="text-[18px] font-semibold leading-normal text-muted-foreground"
          >
            {logo}
          </span>
        ))}
      </div>
    </section>
  )
}
