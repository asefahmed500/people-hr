import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * PeopleHR button system.
 *
 * One component for every action surface in the app: consistent 8px radius,
 * height/padding scale, restrained depth, exact-property transitions and a
 * built-in loading state that keeps the button's width stable and blocks
 * duplicate submissions. Variants form a clear hierarchy — primary actions
 * are solid, secondary/outline are quiet, destructive is unmistakable, and
 * ghost/link stay flat for dense toolbars and tables.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-lg border border-transparent bg-clip-padding text-[13.5px] font-medium leading-none tracking-[-0.01em]",
    "whitespace-nowrap outline-none select-none",
    "transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-150 ease-[var(--ease-smooth-out)]",
    "hover:shadow-[0_1px_3px_rgb(15_23_42/0.10)] active:scale-[0.98] active:shadow-none",
    "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:active:scale-100",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "[&_.button-arrow]:transition-transform [&_.button-arrow]:duration-150 group-hover/button:[&_.button-arrow]:translate-x-0.5",
    "aria-expanded:bg-muted aria-expanded:text-foreground",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — the single most important action in a view.
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(15_23_42/0.08)] hover:bg-primary/90",
        // Secondary — a supported alternative next to a primary action.
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-border/80 hover:bg-secondary/70",
        // Outline — quieter, used for export/back and toolbar actions.
        outline: "border-border bg-card text-foreground hover:border-border/80 hover:bg-muted",
        // Ghost — no chrome until hover; dense tables and menus.
        ghost: "text-secondary-foreground hover:bg-muted hover:text-foreground",
        // Destructive — clearly distinct, reserved for irreversible actions.
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_1px_2px_rgb(180_35_24/0.18)] hover:bg-destructive/90",
        // Link — navigational, no button chrome and no min width.
        link: "min-w-0 px-0 text-primary underline-offset-4 hover:bg-transparent hover:shadow-none hover:underline active:scale-100",
        // Soft — tinted primary for highlighted but not dominant actions.
        soft: "border-primary/10 bg-primary/[0.07] text-primary hover:border-primary/20 hover:bg-primary/[0.13] hover:shadow-none",
      },
      size: {
        default: "h-10 min-w-[112px] gap-2 px-5",
        xs: "h-8 min-w-[76px] gap-1.5 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 min-w-[96px] gap-1.5 px-4 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 min-w-[132px] gap-2.5 px-6 text-sm",
        icon: "size-10 p-0",
        "icon-xs": "size-8 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner + label swap, disables the control and blocks repeat clicks. */
    loading?: boolean
    /** Label shown while loading. Defaults to "Working…". */
    loadingText?: string
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingText = "Working…",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ variant, size }),
        loading && "cursor-wait",
        className,
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span className="button-label-in">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
