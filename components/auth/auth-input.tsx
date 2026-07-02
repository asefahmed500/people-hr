import * as React from "react"
import { cn } from "@/lib/utils"

type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  trailing?: React.ReactNode
}

export function AuthInput({ label, trailing, className, ...props }: AuthInputProps) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="font-sans text-[13px] font-semibold leading-normal text-[#42504a]">
        {label}
      </span>
      <div className="flex h-12 w-full items-center rounded-[11px] border border-[#e3ded4] bg-white px-4 py-0 transition-colors focus-within:border-[#2f6f61]/60 focus-within:ring-2 focus-within:ring-[#2f6f6133]">
        <input
          className={cn(
            "h-full w-full bg-transparent font-sans text-sm text-[#1f2a26] outline-none placeholder:text-[#a7ada6]",
            className,
          )}
          {...props}
        />
        {trailing}
      </div>
    </label>
  )
}
