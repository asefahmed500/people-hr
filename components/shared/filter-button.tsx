"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type FilterOption = { value: string; label: string }

type FilterButtonProps = {
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  ariaLabel?: string
  align?: "start" | "end"
}

export function FilterButton({
  value,
  onChange,
  options,
  ariaLabel,
  align = "start",
}: FilterButtonProps) {
  const current = options.find((o) => o.value === value) ?? options[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? current?.label}
          className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted sm:flex-none"
        >
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            {current?.label ?? "Filter"}
          </span>
          <ChevronDown className="size-[15px] text-muted-foreground" strokeWidth={2} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-[200px]">
        <DropdownMenuLabel className="font-sans text-[11px] uppercase tracking-[0.09em] text-muted-foreground">
          Filter
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex items-center justify-between font-sans text-[13px] text-foreground"
          >
            {opt.label}
            {opt.value === value ? (
              <Check className="size-3.5 text-primary" strokeWidth={2.5} aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
