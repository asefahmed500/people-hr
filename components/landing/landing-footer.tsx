import * as React from "react"
import Link from "next/link"
import { Users } from "lucide-react"

const footerLinks = [
  { label: "Overview", href: "/#product" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Customers", href: "/#customers" },
  { label: "Pricing", href: "/signup" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Sign in", href: "/login" },
  { label: "Create an account", href: "/signup" },
  { label: "Help center", href: "/login" },
  { label: "Contact support", href: "mailto:support@northwind.co" },
  { label: "Talk to sales", href: "mailto:sales@northwind.co" },
]

export function LandingFooter() {
  return (
    <footer className="flex w-full flex-col items-center gap-5 border-t border-border px-5 py-14 text-center sm:px-10 lg:px-20">
      <Link href="/" className="flex w-fit items-center gap-2.5">
        <Users className="size-5 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
        <span className="text-h3 font-semibold text-muted-foreground">
          PeopleHR
        </span>
      </Link>
      <p className="max-w-[520px] font-sans text-[13px] leading-[1.6] text-muted-foreground">
        The calm, human platform for hiring, onboarding, payroll and
        everything in between.
      </p>
      <nav aria-label="Footer" className="flex max-w-[900px] flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {footerLinks.map((link, i) => (
          <React.Fragment key={link.label}>
            {i > 0 ? (
              <span aria-hidden="true" className="text-muted-foreground">·</span>
            ) : null}
            <Link
              href={link.href}
              className="font-sans text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>
      <p className="font-sans text-[11px] text-muted-foreground">
        &copy; {new Date().getFullYear()} PeopleHR, Inc.
      </p>
    </footer>
  )
}
