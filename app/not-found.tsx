import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        404 — Page not found
      </span>
      <h1 className="text-h1 text-foreground">This page doesn’t exist</h1>
      <p className="max-w-[420px] font-sans text-[13.5px] leading-normal text-secondary-foreground">
        The link may be outdated or the page may have moved. Head back to your dashboard to keep
        working.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  )
}
