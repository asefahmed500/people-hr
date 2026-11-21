import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { jobTypeLabel, type JobStatus } from "./types"

type BadgeVariant = "secondary" | "default" | "outline" | "destructive"

const STATUS_STYLES: Record<
  JobStatus,
  { label: string; variant: BadgeVariant; tone: string }
> = {
  queued: {
    label: "Queued",
    variant: "secondary",
    tone: "bg-muted text-muted-foreground",
  },
  running: {
    label: "Running",
    variant: "default",
    tone: "bg-foreground/10 text-primary",
  },
  succeeded: {
    label: "Succeeded",
    variant: "outline",
    tone: "bg-foreground/10 text-foreground",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    tone: "bg-foreground text-background",
  },
  dead: {
    label: "Dead",
    variant: "secondary",
    tone: "bg-muted text-secondary-foreground",
  },
  unknown: {
    label: "Unknown",
    variant: "secondary",
    tone: "bg-muted text-muted-foreground",
  },
}

export function StatusPill({ status }: { status: JobStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown
  return (
    <Badge
      variant={style.variant}
      className={cn("text-[10px]", style.tone)}
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-current"
        aria-hidden="true"
      />
      {style.label}
    </Badge>
  )
}

export function JobTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className="max-w-full rounded-md bg-muted text-secondary-foreground"
    >
      <span className="truncate">{jobTypeLabel(type)}</span>
    </Badge>
  )
}
