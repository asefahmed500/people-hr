import { Check, Download, LogIn, Plus } from "lucide-react"

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
        <button
          type="button"
          onClick={onExport}
          className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Download className="size-4 text-secondary-foreground" strokeWidth={2} />
          <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
            Export
          </span>
        </button>
        {onClockIn ? (
          clockedInTime ? (
            <span className="flex h-10 cursor-default items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4">
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              <span className="font-sans text-[13px] font-medium leading-normal text-emerald-700 dark:text-emerald-400">
                Checked in · {clockedInTime}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onClockIn}
              className="flex h-10 items-center gap-2 rounded-lg border border-border bg-gradient-to-b from-white to-[#ececea] px-4 shadow-xs transition-colors hover:to-[#e2e2df]"
            >
              <LogIn className="size-4 text-secondary-foreground" strokeWidth={2} />
              <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
                Clock in
              </span>
            </button>
          )
        ) : null}
        {onMarkAttendance ? (
          <button
            type="button"
            onClick={onMarkAttendance}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 transition-colors hover:bg-muted"
          >
            <Plus className="size-4 text-secondary-foreground" strokeWidth={2} />
            <span className="font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
              Mark attendance
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
