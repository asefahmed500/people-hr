import { Briefcase, X } from "lucide-react"

import type { Opening } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function OpenRolesByDept({
  openings,
  onCloseOpening,
}: {
  openings: Opening[]
  onCloseOpening?: (id: string) => void
}) {
  const byDept = openings.reduce<Record<string, number>>((acc, o) => {
    acc[o.department] = (acc[o.department] ?? 0) + 1
    return acc
  }, {})
  const rows = Object.entries(byDept).map(([name, count]) => ({ name, count }))
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="text-h4">
        Open roles by department
      </h2>
      <div className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center">
            <Briefcase className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
            <p className="font-sans text-[13px] font-semibold text-foreground">No open roles yet</p>
            <p className="font-sans text-[12.5px] text-muted-foreground">Post a role to start your pipeline.</p>
          </div>
        ) : null}
        {rows.map((row) => (
          <div key={row.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold leading-normal text-foreground">
                {row.name}
              </span>
              <span className="font-sans text-[11px] leading-normal text-muted-foreground">
                {row.count} open
              </span>
            </div>
            <Progress value={(row.count / max) * 100} className="h-1.5" />
          </div>
        ))}
      </div>
      {openings.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-t-border pt-3">
          {openings.slice(0, 4).map((o) => (
            <div
              key={o.id}
              className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-sans text-[12.5px] font-medium text-foreground">
                  {o.title}
                </span>
                <span className="font-sans text-[11px] text-muted-foreground">
                  {o.department} · {o.location} · {o.applicants} applicants
                </span>
              </div>
              {onCloseOpening ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Close ${o.title}`}
                  onClick={() => onCloseOpening(o.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
