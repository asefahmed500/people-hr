"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={ariaLabel ?? current?.label}
          className="flex-1 sm:flex-none"
        >
          <span>{current?.label ?? "Filter"}</span>
          <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-150 group-hover/button:translate-y-0.5" strokeWidth={2} aria-hidden="true" />
        </Button>
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
