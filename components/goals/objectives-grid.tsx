import { Check, Pencil, Plus, Trash2 } from "lucide-react"

import type { Objective as ObjectiveType } from "@/lib/data"
import { cn } from "@/lib/utils"

const statusStyles: Record<
  ObjectiveType["status"],
  { dot: string; pillBg: string; pillText: string; label: string; bar: string }
> = {
  "on-track": {
    dot: "bg-primary",
    pillBg: "bg-foreground/10",
    pillText: "text-primary",
    label: "On track",
    bar: "bg-primary",
  },
  "at-risk": {
    dot: "bg-secondary-foreground",
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    label: "At risk",
    bar: "bg-secondary-foreground",
  },
  completed: {
    dot: "bg-primary",
    pillBg: "bg-foreground/10",
    pillText: "text-secondary-foreground",
    label: "Completed",
    bar: "bg-primary",
  },
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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted px-6 py-12 text-center">
        <p className="font-sans text-[14px] font-semibold text-foreground">No objectives yet</p>
        <p className="font-sans text-[12.5px] text-muted-foreground">
          Create your first company objective to start tracking key results.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
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
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-sans text-[10px] font-semibold text-foreground">
                Overdue
              </span>
            ) : null}
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold leading-normal",
                s.pillBg,
                s.pillText,
              )}
            >
              <span className={`size-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            {onEdit ? (
              <button
                type="button"
                aria-label={`Edit ${obj.title}`}
                onClick={() => onEdit(obj)}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Pencil className="size-3.5" strokeWidth={2} />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                aria-label={`Delete ${obj.title}`}
                onClick={() => onDelete(obj)}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Trash2 className="size-3.5" strokeWidth={2} />
              </button>
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
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/10">
          <span className="font-sans text-[11px] font-semibold leading-normal text-primary">
            {obj.ownerInit}
          </span>
        </div>
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
      <div className="flex h-1.5 w-full overflow-clip rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", s.bar)}
          style={{ width: `${obj.progress}%` }}
        />
      </div>
      <div className="flex flex-col gap-2 border-t border-t-border pt-3">
        {obj.krs.map((kr, idx) => {
          const done = kr.pct >= 100
          const row = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "font-sans inline-block truncate text-[12.5px] leading-normal text-secondary-foreground",
                  )}
                >
                  {done ? <Check className="mr-1 inline size-3.5 text-primary" strokeWidth={3} /> : null}
                  {kr.label}
                </span>
                <span className="font-sans inline-block shrink-0 text-[11px] font-semibold leading-normal text-secondary-foreground">
                  {kr.pct}%
                </span>
              </div>
              <div className="flex h-1 w-full overflow-clip rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", done ? "bg-primary" : "bg-secondary-foreground")}
                  style={{ width: `${kr.pct}%` }}
                />
              </div>
            </>
          )
          return (
            <div key={kr.id} className="group flex items-center gap-2">
              {onCycleKr ? (
                <button
                  type="button"
                  onClick={() => onCycleKr(obj.id, idx)}
                  title={done ? "Click to reset to 0%" : "Click to advance progress"}
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {row}
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 flex-col gap-1">{row}</div>
              )}
              {onRemoveKr ? (
                <button
                  type="button"
                  aria-label={`Remove key result ${kr.label}`}
                  onClick={() => onRemoveKr(obj.id, kr.id)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          )
        })}
        {onAddKr ? (
          <button
            type="button"
            onClick={() => onAddKr(obj)}
            className="mt-0.5 flex items-center gap-1.5 rounded-lg px-2 py-1 text-left text-primary transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            <span className="font-sans text-[12px] font-medium leading-normal">Add key result</span>
          </button>
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
