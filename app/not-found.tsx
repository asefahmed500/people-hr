import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background px-6 py-12 text-center">
      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        404 — Page not found
      </span>
      <h1 className="joi-display max-w-[900px]">This page doesn’t exist</h1>
      <p className="max-w-[420px] font-sans text-[14px] leading-normal text-muted-foreground">
        The link may be outdated or the page may have moved. Head back to your dashboard to keep
        working.
      </p>
      <Button asChild className="mt-2">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  )
}
