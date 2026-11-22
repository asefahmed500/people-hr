"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Menu, Users, X } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Customers", href: "/#customers" },
]

export function LandingTopNav() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="relative z-50 w-full px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="relative mx-auto w-full max-w-[1200px]">
        <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2.5 sm:px-6">
          <Link
            href="/"
            className="flex w-fit shrink-0 items-center gap-2.5"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground">
              <Users className="size-[17px] text-background" strokeWidth={2} aria-hidden="true" />
            </div>
            <span className="text-h4 font-semibold">
              PeopleHR
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-sans text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                Get started
                <ArrowRight className="button-arrow size-3.5" strokeWidth={2} aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden"
          >
            {open ? (
              <X className="size-5" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
            )}
          </Button>
        </div>

        {open ? (
          <nav
            aria-label="Mobile"
            className="absolute inset-x-0 top-full z-50 mt-2 flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-2.5 font-sans text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Separator className="my-1" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-2.5 font-sans text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started
              <ArrowRight className="size-[15px]" strokeWidth={2} aria-hidden="true" />
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  )
}
