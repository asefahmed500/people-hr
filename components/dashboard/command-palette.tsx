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
import { commandActions, consumePendingAction, setPendingAction } from "@/lib/command-actions"
import { navItems } from "./nav-data"

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (href: string) => void
  role: string
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  role,
}: CommandPaletteProps) {
  const visibleNav = navItems.filter((item) => !item.roles || item.roles.includes(role))
  const visibleActions = commandActions.filter((a) => !a.roles || a.roles.includes(role))
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-xl! border border-border"
    >
      <Command>
        <CommandInput placeholder="Search pages, actions…" aria-label="Search pages and actions" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {visibleNav.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.href}
                  value={`go ${item.label}`}
                  onSelect={() => onNavigate(item.href)}
                >
                  <Icon className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
                  <span className="font-sans text-[13px] text-foreground">
                    {item.label}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick actions">
            {visibleActions.map((action) => {
              const Icon = action.icon
              return (
                <CommandItem
                  key={action.id}
                  value={action.label}
                  onSelect={() => {
                    setPendingAction(action.id)
                    if (window.location.pathname === action.route) {
                      // Already on the target page: its onAction listener is
                      // registered, so deliver the action over the global event
                      // (and clear the pending flag so it can't re-fire later).
                      consumePendingAction(action.id)
                      window.dispatchEvent(
                        new CustomEvent("peoplehr:action", { detail: { id: action.id } }),
                      )
                    }
                    onNavigate(action.route)
                  }}
                >
                  <Icon className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
                  <span className="font-sans text-[13px] text-foreground">
                    {action.label}
                  </span>
                  <span className="ml-auto font-sans text-[11px] text-muted-foreground">
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
