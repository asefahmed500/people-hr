import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"

const navLinks = [
  { label: "Product", href: "/landing#product" },
  { label: "Solutions", href: "/landing#solutions" },
  { label: "Pricing", href: "/landing#pricing" },
  { label: "Customers", href: "/landing#customers" },
  { label: "Resources", href: "/landing#resources" },
]

export function LandingTopNav() {
  return (
    <header className="flex w-full shrink-0 items-center gap-7 border-b border-[#ece9e2] bg-[#faf9f5e6] px-5 py-0 backdrop-blur sm:px-10 lg:h-[76px] lg:px-20">
      <Link
        href="/landing"
        className="flex w-fit shrink-0 items-center gap-[11px]"
      >
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,_rgb(47,_111,_97)_0%,_rgb(100,_182,_172)_100%)] shadow-[0px_4px_12px_rgba(47,111,97,0.25)]">
          <Users className="size-[18px] text-white" strokeWidth={2} />
        </div>
        <span className="font-display inline-block text-[19px] font-semibold leading-normal tracking-[-0.3px] text-[#1f2a26]">
          AetherPeople
        </span>
      </Link>

      <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="font-sans text-sm font-medium text-[#5b655e] transition-colors hover:text-[#1f2a26]"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex w-fit shrink-0 items-center gap-2.5 lg:ml-0">
        <Link
          href="/login"
          className="flex h-10 items-center rounded-[11px] px-4 font-sans text-sm font-semibold text-[#42504a] transition-colors hover:text-[#1f2a26]"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="flex h-10 items-center gap-[7px] rounded-[11px] bg-[#2f6f61] px-[18px] py-0 font-sans text-sm font-semibold text-white shadow-[0px_6px_16px_rgba(47,111,97,0.24)] transition-colors hover:bg-[#286253]"
        >
          Get started
          <ArrowRight className="size-[15px]" strokeWidth={2} />
        </Link>
      </div>
    </header>
  )
}
