import { X } from "lucide-react"

import type { Opening } from "@/lib/data"

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
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-h4">
        Open roles by department
      </h2>
      <div className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-[12.5px] text-muted-foreground">
            No open roles yet.
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
            <div className="flex h-1.5 w-full overflow-clip rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
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
                <button
                  type="button"
                  aria-label={`Close ${o.title}`}
                  onClick={() => onCloseOpening(o.id)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
