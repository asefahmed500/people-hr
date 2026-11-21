"use client"

import { RefreshCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

type StoreErrorStateProps = {
  onRetry: () => void
  title?: string
  description?: string
}

/**
 * Shown when a store endpoint could not be loaded after all retries.
 * Keeps the user in the dashboard shell and gives them an explicit way out.
 */
export function StoreErrorState({
  onRetry,
  title = "Couldnâ€™t load this section",
  description = "We couldnâ€™t reach the server to load this data. Check your connection and try again, or reload the page.",
}: StoreErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex w-full flex-col items-center justify-center gap-5 rounded-lg border border-border bg-card px-6 py-10 text-center"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <TriangleAlert className="size-6" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-sans text-lg font-semibold leading-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-md font-sans text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Button type="button" onClick={onRetry} className="font-sans text-[13px] font-medium">
          <RefreshCw className="size-4" strokeWidth={2} aria-hidden="true" />
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
          className="font-sans text-[13px] font-medium"
        >
          Reload page
        </Button>
      </div>
    </div>
  )
}
