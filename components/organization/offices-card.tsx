import { Ellipsis, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Office } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type OfficesCardProps = {
  offices?: Office[]
  onAdd?: () => void
  onEdit?: (office: Office) => void
  onDelete?: (office: Office) => void
}

export function OfficesCard({ offices = [], onAdd, onEdit, onDelete }: OfficesCardProps) {
  const total = offices.reduce((s, o) => s + o.count, 0)
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Offices &amp; locations
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Headcount distribution across {offices.length} locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 font-sans text-[12.5px] font-semibold leading-normal text-secondary-foreground">
            {total.toLocaleString()} people
          </span>
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              aria-label="Add office"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-secondary-foreground transition-colors hover:bg-muted"
            >
              <Plus className="size-4" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {offices.map((office, idx) => (
          <OfficeRow
            key={office.city}
            office={office}
            last={idx === offices.length - 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

function OfficeRow({
  office,
  last,
  onEdit,
  onDelete,
}: {
  office: Office
  last: boolean
  onEdit?: (office: Office) => void
  onDelete?: (office: Office) => void
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-0 py-2.5",
        !last && "border-b border-b-border",
      )}
    >
      <div className="flex w-[168px] flex-col">
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
          {office.city}
        </span>
        <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
          {office.country}
        </span>
      </div>
      <div className="flex h-2 flex-1 overflow-clip rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", office.fill)}
          style={{ width: `${office.fillPct}%` }}
        />
      </div>
      <span className="w-[52px] text-right font-sans text-[13px] font-semibold leading-normal text-secondary-foreground">
        {office.count}
      </span>
      {onEdit || onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${office.city}`}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Ellipsis className="size-3.5" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(office)}>Edit office</DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <DropdownMenuItem
                className="text-foreground focus:text-foreground"
                onClick={() => onDelete(office)}
              >
                Delete office
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
