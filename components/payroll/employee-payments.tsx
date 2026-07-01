import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type Status = "paid" | "pending" | "failed"

type Row = {
  initials: string
  name: string
  role: string
  dept: string
  gross: string
  ded: string
  net: string
  status: Status
}

const statusStyles: Record<Status, { dot: string; bg: string; text: string; label: string }> = {
  paid: {
    dot: "bg-[#2f6f61]",
    bg: "bg-[#2f6f611a]",
    text: "text-[#2f6f61]",
    label: "Paid",
  },
  pending: {
    dot: "bg-[#d98a2b]",
    bg: "bg-[#d98a2b1a]",
    text: "text-[#b26a1f]",
    label: "Pending",
  },
  failed: {
    dot: "bg-[#e76f51]",
    bg: "bg-[#e76f511a]",
    text: "text-[#c4553a]",
    label: "Failed",
  },
}

const rows: Row[] = [
  {
    initials: "SJ",
    name: "Sophie Jensen",
    role: "Staff Engineer",
    dept: "Engineering",
    gross: "$12,400",
    ded: "$3,596",
    net: "$8,804",
    status: "paid",
  },
  {
    initials: "MK",
    name: "Marcus Kim",
    role: "Account Executive",
    dept: "Sales",
    gross: "$9,800",
    ded: "$2,842",
    net: "$6,958",
    status: "paid",
  },
  {
    initials: "AP",
    name: "Anika Patel",
    role: "Product Manager",
    dept: "Product",
    gross: "$10,600",
    ded: "$3,074",
    net: "$7,526",
    status: "pending",
  },
  {
    initials: "TW",
    name: "Tom Walsh",
    role: "Senior Designer",
    dept: "Design",
    gross: "$8,200",
    ded: "$2,378",
    net: "$5,822",
    status: "paid",
  },
  {
    initials: "RL",
    name: "Raquel Lopez",
    role: "Content Lead",
    dept: "Marketing",
    gross: "$9,100",
    ded: "$2,639",
    net: "$6,461",
    status: "pending",
  },
  {
    initials: "DN",
    name: "David Nguyen",
    role: "Backend Engineer",
    dept: "Engineering",
    gross: "$11,200",
    ded: "$3,248",
    net: "$7,952",
    status: "paid",
  },
  {
    initials: "CF",
    name: "Clara Fischer",
    role: "People Partner",
    dept: "People",
    gross: "$8,800",
    ded: "$2,552",
    net: "$6,248",
    status: "failed",
  },
]

export function EmployeePayments() {
  return (
    <div className="flex w-full flex-col overflow-clip rounded-[18px] border border-[#edeae3] bg-white shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
            Employee payments
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            284 employees · February 2025
          </span>
        </div>
        <button type="button" className="flex items-center gap-1">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#2f6f61]">
            View all
          </span>
          <ChevronRight className="size-3.5 text-[#2f6f61]" strokeWidth={2} />
        </button>
      </div>
      <div className="flex items-center border-y border-y-[#f1eee8] bg-[#faf9f6] px-6 py-2.5">
        <span className="min-w-0 flex-1 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Employee
        </span>
        <span className="w-[130px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Department
        </span>
        <span className="w-[110px] shrink-0 text-right font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Gross
        </span>
        <span className="w-[110px] shrink-0 text-right font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Deductions
        </span>
        <span className="w-[110px] shrink-0 text-right font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Net
        </span>
        <span className="w-[110px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-[#a6aca3]">
          Status
        </span>
      </div>
      <div className="flex flex-col">
        {rows.map((row, idx) => (
          <PaymentRow key={row.initials + row.name} row={row} last={idx === rows.length - 1} />
        ))}
      </div>
    </div>
  )
}

function PaymentRow({ row, last }: { row: Row; last: boolean }) {
  const s = statusStyles[row.status]
  return (
    <div
      className={cn(
        "flex items-center px-6 py-3.5",
        !last && "border-b border-b-[#f1eee8]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#3bb27326]">
          <span className="font-sans text-[11px] font-semibold leading-normal text-[#2f6f61]">
            {row.initials}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#1f2a26]">
            {row.name}
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
            {row.role}
          </span>
        </div>
      </div>
      <span className="w-[130px] font-sans text-[13px] font-medium leading-normal text-[#5b655e]">
        {row.dept}
      </span>
      <span className="w-[110px] text-right font-sans text-[13px] font-medium leading-normal text-[#42504a]">
        {row.gross}
      </span>
      <span className="w-[110px] text-right font-sans text-[13px] font-medium leading-normal text-[#42504a]">
        {row.ded}
      </span>
      <span className="w-[110px] text-right font-sans text-[13px] font-semibold leading-normal text-[#1f2a26]">
        {row.net}
      </span>
      <div className="flex w-[110px] items-center">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[11.5px] font-semibold leading-normal",
            s.bg,
            s.text,
          )}
        >
          <span className={`size-1.5 shrink-0 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>
    </div>
  )
}
