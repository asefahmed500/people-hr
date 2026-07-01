import { cn } from "@/lib/utils"

type Status = "approved" | "pending" | "declined"

type Request = {
  initials: string
  name: string
  meta: string
  status: Status
}

const requests: Request[] = [
  {
    initials: "SA",
    name: "Sofia Alvarez",
    meta: "Vacation · 5d · Feb 24–28",
    status: "approved",
  },
  {
    initials: "MB",
    name: "Marcus Bailey",
    meta: "Personal · 1d · Feb 21",
    status: "pending",
  },
  {
    initials: "PN",
    name: "Priya Nair",
    meta: "Vacation · 8d · Mar 03–12",
    status: "pending",
  },
  {
    initials: "HL",
    name: "Hana Lindqvist",
    meta: "Sick · 3d · Feb 17–19",
    status: "declined",
  },
]

const statusStyles: Record<
  Status,
  { avatarBg: string; avatarText: string; pillBg: string; pillText: string; label: string }
> = {
  approved: {
    avatarBg: "bg-[#2f6f611a]",
    avatarText: "text-[#2f6f61]",
    pillBg: "bg-[#3bb27326]",
    pillText: "text-[#2e9160]",
    label: "Approved",
  },
  pending: {
    avatarBg: "bg-[#f4a26126]",
    avatarText: "text-[#b96a2c]",
    pillBg: "bg-[#f4a26126]",
    pillText: "text-[#b96a2c]",
    label: "Pending",
  },
  declined: {
    avatarBg: "bg-[#e76f5126]",
    avatarText: "text-[#c4553a]",
    pillBg: "bg-[#e76f5126]",
    pillText: "text-[#c4553a]",
    label: "Declined",
  },
}

export function PendingRequests() {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-5 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
          Pending requests
        </h2>
        <span className="flex items-center rounded-full bg-[#f4a26126] px-2 py-[3px]">
          <span className="font-sans text-[10px] font-semibold leading-normal text-[#b96a2c]">
            2 pending
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {requests.map((req) => (
          <RequestRow key={req.initials + req.name} req={req} />
        ))}
      </div>
    </div>
  )
}

function RequestRow({ req }: { req: Request }) {
  const s = statusStyles[req.status]
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          s.avatarBg,
        )}
      >
        <span className={cn("font-sans text-[11px] font-semibold", s.avatarText)}>
          {req.initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="inline-block overflow-clip font-sans text-[13px] font-medium leading-normal text-[#1f2a26] [text-overflow:ellipsis]">
          {req.name}
        </span>
        <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
          {req.meta}
        </span>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center rounded-full px-2 py-[3px] font-sans text-[10px] font-semibold leading-normal",
          s.pillBg,
          s.pillText,
        )}
      >
        {s.label}
      </span>
    </div>
  )
}
