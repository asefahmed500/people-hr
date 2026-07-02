import Link from "next/link"
import { Users } from "lucide-react"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/landing#product" },
      { label: "Onboarding", href: "/onboarding" },
      { label: "Payroll", href: "/payroll" },
      { label: "Performance", href: "/performance" },
      { label: "Pricing", href: "/landing#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/landing#about" },
      { label: "Customers", href: "/landing#customers" },
      { label: "Careers", href: "/landing#careers" },
      { label: "Blog", href: "/landing#blog" },
      { label: "Contact", href: "/landing#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "/landing#help" },
      { label: "Guides", href: "/landing#guides" },
      { label: "API docs", href: "/landing#api" },
      { label: "Security", href: "/landing#security" },
      { label: "Status", href: "/landing#status" },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="flex w-full flex-col gap-12 border-t border-[#ece9e2] bg-white px-5 py-14 sm:px-10 lg:flex-row lg:gap-16 lg:px-20">
      <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
        <Link href="/landing" className="flex w-fit items-center gap-[11px]">
          <div className="flex size-8 items-center justify-center rounded-[9px] bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(100,_182,_172)_100%)]">
            <Users className="size-[17px] text-white" strokeWidth={2} />
          </div>
          <span className="font-display text-lg font-semibold text-[#1f2a26]">
            AetherPeople
          </span>
        </Link>
        <p className="max-w-[260px] font-sans text-sm leading-[1.6] text-[#8a948d]">
          The calm, human platform for hiring, onboarding, payroll and
          everything in between.
        </p>
        <p className="mt-2 font-sans text-[13px] leading-normal text-[#b0b7af]">
          &copy; 2025 AetherPeople, Inc.
        </p>
      </div>

      <div className="flex w-full flex-1 flex-col gap-10 sm:flex-row sm:gap-16 lg:justify-end">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h4 className="font-sans text-[13px] font-semibold uppercase leading-normal tracking-[1.04px] text-[#42504a]">
              {col.title}
            </h4>
            {col.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-sans text-sm text-[#8a948d] transition-colors hover:text-[#1f2a26]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  )
}
