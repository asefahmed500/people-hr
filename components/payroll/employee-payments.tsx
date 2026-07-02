import { ChevronRight } from "lucide-react"

import type { Payment } from "@/lib/data"
import { formatMoney, paymentStatusStyles } from "@/lib/data"
import { cn } from "@/lib/utils"

function mapPaymentToRow(p: Payment) {
  const net = p.gross - p.deductions
  return {
    initials: p.initials,
    name: p.name,
    role: p.role,
    dept: p.department,
    gross: formatMoney(p.gross),
    ded: formatMoney(p.deductions),
    net: formatMoney(net),
    status: p.status,
  }
}

export function EmployeePayments({
  payments,
  onViewAll,
}: {
  payments?: Payment[]
  onViewAll?: () => void
}) {
  const rows = (payments ?? []).map(mapPaymentToRow)

  return (
    <div className="flex w-full flex-col overflow-clip rounded-[18px] border border-[#edeae3] bg-white shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-tight text-[#1f2a26]">
            Employee payments
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            {payments?.length ?? 0} employees · February 2025
          </span>
        </div>
        <button type="button" onClick={onViewAll} className="flex items-center gap-1">
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
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <span className="font-sans text-[13px] leading-normal text-[#8a948d]">
              No payment records
            </span>
          </div>
        ) : (
          rows.map((row, idx) => (
            <PaymentRow key={row.initials + row.name} row={row} last={idx === rows.length - 1} />
          ))
        )}
      </div>
    </div>
  )
}

type Row = ReturnType<typeof mapPaymentToRow>

function PaymentRow({ row, last }: { row: Row; last: boolean }) {
  const s = paymentStatusStyles[row.status]
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
