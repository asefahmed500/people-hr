import Link from "next/link"
import { Users } from "lucide-react"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/#product" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Customers", href: "/#customers" },
      { label: "Pricing", href: "/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/signup" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "/login" },
      { label: "Contact support", href: "mailto:support@northwind.co" },
      { label: "Talk to sales", href: "mailto:sales@northwind.co" },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="flex w-full flex-col gap-12 border-t border-border bg-card px-5 py-14 sm:px-10 lg:flex-row lg:gap-16 lg:px-20">
      <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
        <Link href="/" className="flex w-fit items-center gap-[11px]">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
            <Users className="size-[17px] text-background" strokeWidth={2} />
          </div>
          <span className="text-h4">
            PeopleHR
          </span>
        </Link>
        <p className="max-w-[260px] font-sans text-sm leading-[1.6] text-muted-foreground">
          The calm, human platform for hiring, onboarding, payroll and
          everything in between.
        </p>
        <p className="mt-2 font-sans text-[13px] leading-normal text-muted-foreground">
          &copy; {new Date().getFullYear()} PeopleHR, Inc.
        </p>
      </div>

      <div className="flex w-full flex-1 flex-col gap-10 sm:flex-row sm:gap-16 lg:justify-end">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h4 className="font-sans text-[13px] font-semibold uppercase leading-normal tracking-[0.09em] text-secondary-foreground">
              {col.title}
            </h4>
            {col.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
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
