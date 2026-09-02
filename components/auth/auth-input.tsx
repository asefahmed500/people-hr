import * as React from "react"
import { cn } from "@/lib/utils"

type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  trailing?: React.ReactNode
  error?: string
}

export function AuthInput({ label, trailing, error, className, ...props }: AuthInputProps) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      {label ? (
        <span className="font-sans text-[13px] font-semibold leading-normal text-secondary-foreground">
          {label}
        </span>
      ) : null}
      <div className="flex h-12 w-full items-center rounded-lg border border-border bg-card px-4 py-0 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          aria-invalid={!!error}
          className={cn(
            "h-full w-full bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground",
            className,
          )}
          {...props}
        />
        {trailing}
      </div>
      {error ? (
        <span className="font-sans text-[11px] text-destructive">{error}</span>
      ) : null}
    </label>
  )
}
