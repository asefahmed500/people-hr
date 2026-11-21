import { Check, Download, LogIn, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type AttendanceHeaderProps = {
  onExport?: () => void
  onMarkAttendance?: () => void
  /** Clock the signed-in user in; undefined hides the button. */
  onClockIn?: () => void
  /** Time string when the user already checked in today (disables the button). */
  clockedInTime?: string | null
}

export function AttendanceHeader({ onExport, onMarkAttendance, onClockIn, clockedInTime }: AttendanceHeaderProps) {
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">
          Attendance
        </h1>
        <p className="font-sans inline-block text-[13.5px] leading-normal text-secondary-foreground">
          Real-time check-in overview across all teams
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <Button type="button" variant="outline" onClick={onExport} className="h-9 px-4">
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </Button>
        {onClockIn ? (
          clockedInTime ? (
            <Badge variant="secondary" className="h-9 gap-2 rounded-lg px-4 text-[13px] font-medium">
              <Check className="size-4" strokeWidth={2} aria-hidden="true" />
              Checked in Â· {clockedInTime}
            </Badge>
          ) : (
            <Button type="button" variant="secondary" onClick={onClockIn} className="h-9 px-4">
              <LogIn className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
              <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
                Clock in
              </span>
            </Button>
          )
        ) : null}
        {onMarkAttendance ? (
          <Button type="button" variant="outline" onClick={onMarkAttendance} className="h-9 px-4">
            <Plus className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
            <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              Mark attendance
            </span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
