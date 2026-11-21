import { Check, Pencil, Plus, Target, Trash2 } from "lucide-react"

import type { Objective as ObjectiveType } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const statusStyles: Record<
  ObjectiveType["status"],
  { dot: string; variant: "secondary" | "outline"; label: string }
> = {
  "on-track": { dot: "bg-primary", variant: "secondary", label: "On track" },
  "at-risk": { dot: "bg-secondary-foreground", variant: "outline", label: "At risk" },
  completed: { dot: "bg-primary", variant: "secondary", label: "Completed" },
}

export function ObjectivesGrid({
  objectives,
  onCycleKr,
  onRemoveKr,
  onAddKr,
  onEdit,
  onDelete,
}: {
  objectives: ObjectiveType[]
  onCycleKr?: (objId: string, krIdx: number) => void
  onRemoveKr?: (objId: string, krId: string) => void
  onAddKr?: (obj: ObjectiveType) => void
  onEdit?: (obj: ObjectiveType) => void
  onDelete?: (obj: ObjectiveType) => void
}) {
  if (objectives.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center">
        <Target className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
        <p className="font-sans text-[14px] font-semibold text-foreground">No objectives yet</p>
        <p className="font-sans text-[12.5px] text-muted-foreground">
          Create your first company objective to start tracking key results.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {objectives.map((obj) => (
          <ObjectiveCard
            key={obj.id}
            obj={obj}
            onCycleKr={onCycleKr}
            onRemoveKr={onRemoveKr}
            onAddKr={onAddKr}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </TooltipProvider>
  )
}

function ObjectiveCard({
  obj,
  onCycleKr,
  onRemoveKr,
  onAddKr,
  onEdit,
  onDelete,
}: {
  obj: ObjectiveType
  onCycleKr?: (objId: string, krIdx: number) => void
  onRemoveKr?: (objId: string, krId: string) => void
  onAddKr?: (obj: ObjectiveType) => void
  onEdit?: (obj: ObjectiveType) => void
  onDelete?: (obj: ObjectiveType) => void
}) {
  const s = statusStyles[obj.status]
  const isOverdue =
    !!obj.deadline && obj.status !== "completed" && obj.deadline < todayISO()

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <span className="font-sans inline-block text-[11px] font-semibold uppercase leading-normal tracking-[0.6px] text-muted-foreground">
          {obj.eyebrow}
        </span>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-sans inline-block text-[15px] font-semibold leading-tight text-foreground">
            {obj.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {isOverdue ? (
              <Badge variant="destructive" className="text-[10px] font-semibold">Overdue</Badge>
            ) : null}
            <Badge variant={s.variant} className="gap-1.5 text-[11px] font-semibold">
              <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
              {s.label}
            </Badge>
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-6"
                aria-label={`Edit ${obj.title}`}
                onClick={() => onEdit(obj)}
              >
                <Pencil className="size-3.5" strokeWidth={2} aria-hidden="true" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-6"
                aria-label={`Delete ${obj.title}`}
                onClick={() => onDelete(obj)}
              >
                <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
        {obj.description ? (
          <p className="font-sans inline-block text-[12.5px] leading-normal text-secondary-foreground">
            {obj.description}
          </p>
        ) : null}
        {obj.deadline ? (
          <p className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
            Deadline · {obj.deadline}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8">
          <AvatarFallback className="text-[11px] font-semibold">{obj.ownerInit}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="font-sans inline-block overflow-clip text-[12.5px] font-semibold leading-normal text-foreground [text-overflow:ellipsis]">
            {obj.ownerName}
          </span>
          <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
            {obj.ownerRole}
          </span>
        </div>
        <span className="ml-auto text-[22px] font-semibold leading-none text-foreground">
          {obj.progress}%
        </span>
      </div>
      <Progress value={obj.progress} className="h-1.5" />
      <div className="flex flex-col gap-2 border-t border-t-border pt-3">
        {obj.krs.map((kr, idx) => {
          const done = kr.pct >= 100
          const row = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans inline-block truncate text-[12.5px] leading-normal text-secondary-foreground">
                  {done ? <Check className="mr-1 inline size-3.5 text-primary" strokeWidth={3} aria-hidden="true" /> : null}
                  {kr.label}
                </span>
                <span className="font-sans inline-block shrink-0 text-[11px] font-semibold leading-normal text-secondary-foreground">
                  {kr.pct}%
                </span>
              </div>
              <Progress value={kr.pct} className="h-1" />
            </>
          )
          return (
            <div key={kr.id} className="group flex items-center gap-2">
              {onCycleKr ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onCycleKr(obj.id, idx)}
                      className="h-auto min-w-0 flex-1 flex-col items-stretch gap-1 p-0 text-left"
                    >
                      {row}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{done ? "Click to reset to 0%" : "Click to advance progress"}</TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex min-w-0 flex-1 flex-col gap-1">{row}</div>
              )}
              {onRemoveKr ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 shrink-0 opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={`Remove key result ${kr.label}`}
                  onClick={() => onRemoveKr(obj.id, kr.id)}
                >
                  <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          )
        })}
        {onAddKr ? (
          <Button
            type="button"
            variant="link"
            onClick={() => onAddKr(obj)}
            className="mt-0.5 h-auto gap-1.5 justify-start px-2 text-[12px] font-medium"
          >
            <Plus className="size-3.5" strokeWidth={2} aria-hidden="true" />
            Add key result
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}
