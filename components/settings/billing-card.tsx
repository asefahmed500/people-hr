"use client"

import { CreditCard, Download, Receipt } from "lucide-react"
import { notify } from "@/lib/toast"

const invoices = [
  { id: "INV-001", date: "Feb 1, 2025", amount: "$2,400.00", status: "Paid" },
  { id: "INV-002", date: "Jan 1, 2025", amount: "$2,400.00", status: "Paid" },
  { id: "INV-003", date: "Dec 1, 2024", amount: "$2,400.00", status: "Paid" },
]

export function BillingCard() {
  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#e8ebe6] bg-white p-5">
      <span className="font-sans text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Billing & invoices
      </span>

      <div className="flex items-center gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f6f4ef]">
          <CreditCard className="size-[16px] text-[#5b655e]" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-sans text-[13px] font-medium leading-normal text-[#1f2a26]">
            Payment method
          </span>
          <span className="font-sans text-[11.5px] leading-normal text-[#8a948d]">
            Visa ending in 4242 · Expires 12/26
          </span>
        </div>
        <button
          type="button"
          onClick={() => notify.info("Payment method update coming soon")}
          className="rounded-lg border border-[#e8ebe6] bg-white px-3 py-1.5 font-sans text-[12px] font-medium text-[#2f6f61]"
        >
          Update
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-sans text-[13px] font-semibold leading-normal text-[#1f2a26]">
          Recent invoices
        </span>
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-3"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f4ef]">
              <Receipt className="size-[14px] text-[#5b655e]" strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-sans text-[12.5px] font-medium leading-normal text-[#1f2a26]">
                {inv.id}
              </span>
              <span className="font-sans text-[11px] leading-normal text-[#8a948d]">
                {inv.date} · {inv.amount}
              </span>
            </div>
            <span className="rounded-full bg-[#3bb2731f] px-2 py-0.5 font-sans text-[10px] font-semibold text-[#2e9160]">
              {inv.status}
            </span>
            <button
              type="button"
              onClick={() => notify.success(`Downloading ${inv.id}`)}
              className="flex size-7 items-center justify-center rounded-md text-[#8a948d] hover:bg-[#f1eee8]"
            >
              <Download className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
