import { Ellipsis, MapPin, Plus } from "lucide-react"

import type { Office } from "@/lib/data"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type OfficesCardProps = {
  offices?: Office[]
  onAdd?: () => void
  onEdit?: (office: Office) => void
  onDelete?: (office: Office) => void
}

export function OfficesCard({ offices = [], onAdd, onEdit, onDelete }: OfficesCardProps) {
  const total = offices.reduce((s, o) => s + o.count, 0)
  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-h3">
            Offices &amp; locations
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Headcount distribution across {offices.length} locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 text-[12.5px] font-semibold">
            {total.toLocaleString()} people
          </Badge>
          {onAdd ? (
            <Button type="button" variant="outline" size="icon-sm" onClick={onAdd} aria-label="Add office">
              <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>
      {offices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center">
          <MapPin className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
          <p className="font-sans text-[13px] font-semibold text-foreground">No offices yet</p>
          <p className="font-sans text-[12.5px] leading-normal text-muted-foreground">
            Add a location to see its headcount distribution.
          </p>
        </div>
      ) : (
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
      )}
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
        "group flex items-center gap-2 px-0 py-2.5 sm:gap-4",
        !last && "border-b border-b-border",
      )}
    >
      <div className="flex min-w-0 w-[96px] flex-col sm:w-[168px]">
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
          {office.city}
        </span>
        <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
          {office.country}
        </span>
      </div>
      <Progress value={office.fillPct} className="h-2 flex-1" />
      <span className="w-[44px] shrink-0 text-right font-sans text-[13px] font-semibold leading-normal text-secondary-foreground sm:w-[52px]">
        {office.count}
      </span>
      {onEdit || onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions for ${office.city}`}
              className="shrink-0 text-muted-foreground transition-opacity hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Ellipsis className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </Button>
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
