"use client"

import * as React from "react"
import Link from "next/link"
import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Route-level error boundary. Catches render/data errors in app segments so a
 * single broken page never blanks the whole application. Users get a clear
 * explanation and a way to recover without a hard reload.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Surface the failure to the console/monitoring without exposing raw
    // technical details in the UI.
    console.error("Unhandled route error:", error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background px-6 py-12 text-center">
      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Something went wrong
      </span>
      <h1 className="joi-display max-w-[900px]">We couldn’t load this page</h1>
      <p className="max-w-[420px] font-sans text-[14px] leading-normal text-muted-foreground">
        This is usually temporary. Try again, or head back to your dashboard and continue from
        there.
      </p>
      {error.digest ? (
        <p className="font-mono text-[11px] text-muted-foreground">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="size-4" strokeWidth={2} aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
