"use client"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { commandActions, dispatchAction } from "@/lib/command-actions"
import { navItems } from "./nav-data"

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (href: string) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Search pages, actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.href}
                  value={`go ${item.label}`}
                  onSelect={() => onNavigate(item.href)}
                >
                  <Icon className="size-4 text-[#8a948d]" strokeWidth={2} />
                  <span className="font-sans text-[13px] text-[#1f2a26]">
                    {item.label}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick actions">
            {commandActions.map((action) => {
              const Icon = action.icon
              return (
                <CommandItem
                  key={action.id}
                  value={action.label}
                  onSelect={() => {
                    dispatchAction(action.id)
                    onOpenChange(false)
                  }}
                >
                  <Icon className="size-4 text-[#8a948d]" strokeWidth={2} />
                  <span className="font-sans text-[13px] text-[#1f2a26]">
                    {action.label}
                  </span>
                  <span className="ml-auto font-sans text-[11px] text-[#a6aca3]">
                    {action.hint}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
