import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type LeaveType = "vac" | "sick" | "pers" | "par"

type Pill = {
  initials: string
  type: LeaveType
}

type DayCell = {
  day: number | null
  pills?: Pill[]
  today?: boolean
}

const pillStyles: Record<LeaveType, { bg: string; text: string; label: string }> = {
  vac: { bg: "bg-[#c14d6d1a]", text: "text-[#c14d6d]", label: "Vac" },
  sick: { bg: "bg-[#64748b1a]", text: "text-[#64748b]", label: "Sick" },
  pers: { bg: "bg-[#d98a2b1a]", text: "text-[#d98a2b]", label: "Pers" },
  par: { bg: "bg-[#42504a1a]", text: "text-[#42504a]", label: "Par" },
}

// February 2025 starts on Saturday (5 weeks shown, leading Mon-Fri empty)
const weeks: DayCell[][] = [
  // Week 1: empty × 5, 1, 2
  [
    { day: null },
    { day: null },
    { day: null },
    { day: null },
    { day: null },
    { day: 1, pills: [{ initials: "SA", type: "vac" }] },
    { day: 2 },
  ],
  // Week 2: 3, 4, 5(Sick DO), 6, 7(Vac PN), 8, 9(Pers MB)
  [
    { day: 3 },
    { day: 4 },
    { day: 5, pills: [{ initials: "DO", type: "sick" }] },
    { day: 6 },
    { day: 7, pills: [{ initials: "PN", type: "vac" }] },
    { day: 8 },
    { day: 9, pills: [{ initials: "MB", type: "pers" }] },
  ],
  // Week 3: 10, 11(Vac LF), 12, 13(Sick HN), 14(Vac SA), 15, 16(Pers DO)
  [
    { day: 10 },
    { day: 11, pills: [{ initials: "LF", type: "vac" }] },
    { day: 12 },
    { day: 13, pills: [{ initials: "HN", type: "sick" }] },
    { day: 14, pills: [{ initials: "SA", type: "vac" }] },
    { day: 15 },
    { day: 16, pills: [{ initials: "DO", type: "pers" }] },
  ],
  // Week 4: 17(Sick HN), 18 TODAY (Vac MB), 19, 20(Pers LF), 21(Sick DO), 22, 23
  [
    { day: 17, pills: [{ initials: "HN", type: "sick" }] },
    { day: 18, today: true, pills: [{ initials: "MB", type: "vac" }] },
    { day: 19 },
    { day: 20, pills: [{ initials: "LF", type: "pers" }] },
    { day: 21, pills: [{ initials: "DO", type: "sick" }] },
    { day: 22 },
    { day: 23 },
  ],
  // Week 5: 24(Vac SA, Vac PN), 25, 26(Par LF), 27, 28(Sick HN), empty, empty
  [
    {
      day: 24,
      pills: [
        { initials: "SA", type: "vac" },
        { initials: "PN", type: "vac" },
      ],
    },
    { day: 25 },
    { day: 26, pills: [{ initials: "LF", type: "par" }] },
    { day: 27 },
    { day: 28, pills: [{ initials: "HN", type: "sick" }] },
    { day: null },
    { day: null },
  ],
]

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function LeaveCalendar() {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-clip rounded-[18px] border border-[#edeae3] bg-white p-6 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
            February 2025
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              className="flex size-7 items-center justify-center rounded-lg border border-[#edeae3] bg-white"
            >
              <ChevronLeft className="size-4 text-[#6b7770]" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Next month"
              className="flex size-7 items-center justify-center rounded-lg border border-[#edeae3] bg-white"
            >
              <ChevronRight className="size-4 text-[#6b7770]" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LegendItem dot="bg-[#c14d6d]" label="Vacation" />
          <LegendItem dot="bg-[#64748b]" label="Sick" />
          <LegendItem dot="bg-[#d98a2b]" label="Personal" />
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        {weekdays.map((day) => (
          <div key={day} className="flex flex-1 justify-center">
            <span className="font-sans text-[10px] font-semibold uppercase leading-normal tracking-[0.25px] text-[#8a948d]">
              {day}
            </span>
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-1 gap-1">
            {week.map((cell, di) => (
              <DayCell key={`${wi}-${di}`} cell={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function LegendItem({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`size-2 shrink-0 rounded-full ${dot}`} />
      <span className="font-sans inline-block text-[11px] leading-normal text-[#6b7770]">
        {label}
      </span>
    </div>
  )
}

function DayCell({ cell }: { cell: DayCell }) {
  if (cell.day === null) {
    return (
      <div className="flex min-h-16 flex-1 flex-col rounded-[10px] border border-[#f1eee8] bg-[#faf9f6] p-[5px]" />
    )
  }
  return (
    <div
      className={cn(
        "relative flex min-h-16 flex-1 flex-col gap-[3px] rounded-[10px] border p-[5px]",
        cell.today
          ? "border-[#c14d6d] bg-[#c14d6d1a]"
          : "border-[#f1eee8] bg-white",
      )}
    >
      <span
        className={cn(
          "font-sans inline-block text-[11px] font-medium leading-normal",
          cell.today ? "text-[#c14d6d] font-semibold" : "text-[#8a948d]",
        )}
      >
        {cell.day}
      </span>
      {cell.pills?.map((pill, idx) => {
        const style = pillStyles[pill.type]
        return (
          <span
            key={`${pill.initials}-${pill.type}-${idx}`}
            className={cn(
              "flex items-center gap-[3px] rounded px-1 py-0.5",
              style.bg,
            )}
          >
            <span
              className={cn(
                "font-sans text-[9px] font-semibold leading-none",
                style.text,
              )}
            >
              {pill.initials} {style.label}
            </span>
          </span>
        )
      })}
    </div>
  )
}
