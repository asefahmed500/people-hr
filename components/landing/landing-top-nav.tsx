"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Menu, Users, X } from "lucide-react"

const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Customers", href: "/#customers" },
]

export function LandingTopNav() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="relative flex w-full shrink-0 items-center gap-7 border-b border-border bg-background/90 px-5 py-0 backdrop-blur sm:px-10 lg:h-[76px] lg:px-20">
      <Link
        href="/"
        className="flex w-fit shrink-0 items-center gap-[11px]"
      >
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-foreground shadow-card">
          <Users className="size-[18px] text-background" strokeWidth={2} />
        </div>
        <span className="text-h4">
          PeopleHR
        </span>
      </Link>

      <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="font-sans text-sm font-medium text-secondary-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="ml-auto flex size-10 items-center justify-center rounded-lg border border-border bg-card text-secondary-foreground lg:hidden"
      >
        {open ? <X className="size-5" strokeWidth={2} /> : <Menu className="size-5" strokeWidth={2} />}
      </button>

      {open ? (
        <nav className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b border-border bg-card px-5 py-4 shadow-lg lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 font-sans text-[15px] font-medium text-secondary-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 font-sans text-[15px] font-medium text-secondary-foreground hover:bg-muted"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center justify-center gap-[7px] rounded-lg bg-primary px-[18px] py-3 font-sans text-[15px] font-medium text-primary-foreground shadow-card"
          >
            Get started
            <ArrowRight className="size-[15px]" strokeWidth={2} />
          </Link>
        </nav>
      ) : null}

      <div className="ml-auto hidden w-fit shrink-0 items-center gap-2.5 lg:ml-0 lg:flex">
        <Link
          href="/login"
          className="flex h-10 items-center rounded-lg px-4 font-sans text-sm font-medium text-secondary-foreground transition-colors hover:text-foreground"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="flex h-10 items-center gap-[7px] rounded-lg bg-primary px-[18px] py-0 font-sans text-sm font-medium text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
        >
          Get started
          <ArrowRight className="size-[15px]" strokeWidth={2} />
        </Link>
      </div>
    </header>
  )
}
