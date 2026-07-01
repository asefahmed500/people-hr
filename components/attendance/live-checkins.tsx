import { cn } from "@/lib/utils"

type Status = "on-time" | "late" | "remote"

type Checkin = {
  initials: string
  name: string
  dept: string
  time: string
  status: Status
}

const statuses: Record<
  Status,
  { label: string; pillBg: string; pillText: string; avatarBg: string; avatarText: string }
> = {
  "on-time": {
    label: "On time",
    pillBg: "bg-[#2e91601a]",
    pillText: "text-[#2e9160]",
    avatarBg: "bg-[#2f6f611a]",
    avatarText: "text-[#2f6f61]",
  },
  late: {
    label: "Late",
    pillBg: "bg-[#b96a2c1a]",
    pillText: "text-[#b96a2c]",
    avatarBg: "bg-[#b96a2c1a]",
    avatarText: "text-[#b96a2c]",
  },
  remote: {
    label: "Remote",
    pillBg: "bg-[#3e94881a]",
    pillText: "text-[#3e9488]",
    avatarBg: "bg-[#3e94881a]",
    avatarText: "text-[#3e9488]",
  },
}

const checkins: Checkin[] = [
  { initials: "SA", name: "Sofia Alvarez", dept: "Design", time: "08:32", status: "on-time" },
  { initials: "DO", name: "Daniel Okafor", dept: "Engineering", time: "08:45", status: "on-time" },
  { initials: "MB", name: "Marcus Bailey", dept: "Sales", time: "09:14", status: "late" },
  { initials: "PN", name: "Priya Nair", dept: "Engineering", time: "08:05", status: "remote" },
  { initials: "LF", name: "Lena Fischer", dept: "People", time: "08:58", status: "on-time" },
  { initials: "HL", name: "Hana Lindqvist", dept: "Product", time: "09:22", status: "late" },
]

export function LiveCheckins() {
  return (
    <div className="flex w-full flex-col overflow-clip rounded-[18px] border border-[#edeae3] bg-white">
      <div className="flex items-center justify-between border-b border-b-[#edeae3] px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="size-2.5 shrink-0 rounded-full bg-[#2e9160]" />
          <h2 className="font-sans inline-block text-sm font-semibold text-[#1f2a26]">
            Live check-ins
          </h2>
        </div>
        <span className="font-sans inline-block text-xs text-[#8a948d]">
          Updated 09:24 AM
        </span>
      </div>
      <div className="flex flex-col">
        {checkins.map((checkin, idx) => (
          <CheckinRow key={checkin.initials} checkin={checkin} last={idx === checkins.length - 1} />
        ))}
      </div>
    </div>
  )
}

function CheckinRow({ checkin, last }: { checkin: Checkin; last: boolean }) {
  const s = statuses[checkin.status]
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-6 py-3.5",
        !last && "border-b border-b-[#f1eee8]",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          s.avatarBg,
        )}
      >
        <span
          className={cn(
            "font-sans text-xs font-semibold",
            s.avatarText,
          )}
        >
          {checkin.initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-sans inline-block text-sm font-semibold text-[#1f2a26]">
          {checkin.name}
        </span>
        <span className="font-sans inline-block text-xs text-[#8a948d]">
          {checkin.dept}
        </span>
      </div>
      <span className="shrink-0 font-sans text-xs text-[#6b7770]">
        {checkin.time}
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center rounded-full px-2.5 py-1 font-sans text-xs font-medium",
          s.pillBg,
          s.pillText,
        )}
      >
        {s.label}
      </span>
    </div>
  )
}
