import type { Payment } from "@/lib/data"
import { formatMoney, paymentStatusStyles } from "@/lib/data"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Ellipsis } from "lucide-react"

function mapPaymentToRow(p: Payment) {
  const net = p.gross - p.deductions
  return {
    id: p.id,
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
  onUpdateStatus,
}: {
  payments?: Payment[]
  onUpdateStatus?: (id: string, status: Payment["status"]) => void
}) {
  const rows = (payments ?? []).map(mapPaymentToRow)

  return (
    <div className="flex w-full flex-col overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      <div className="flex min-w-[760px] items-center justify-between px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Employee payments
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            {payments?.length ?? 0} employees · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
        </div>
      </div>
      <div className="flex min-w-[760px] items-center border-y border-y-border bg-muted px-6 py-2.5">
        <span className="min-w-0 flex-1 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Employee
        </span>
        <span className="w-[130px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Department
        </span>
        <span className="w-[110px] shrink-0 text-right font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Gross
        </span>
        <span className="w-[110px] shrink-0 text-right font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Deductions
        </span>
        <span className="w-[110px] shrink-0 text-right font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Net
        </span>
        <span className="w-[110px] shrink-0 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground">
          Status
        </span>
      </div>
      <div className="flex flex-col">
        {rows.length === 0 ? (
          <div className="flex min-w-[760px] items-center justify-center py-10">
            <span className="font-sans text-[13px] leading-normal text-muted-foreground">
              No payment records
            </span>
          </div>
        ) : (
          rows.map((row, idx) => (
            <PaymentRow
              key={row.initials + row.name}
              row={row}
              last={idx === rows.length - 1}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  )
}

type Row = ReturnType<typeof mapPaymentToRow>

function PaymentRow({
  row,
  last,
  onUpdateStatus,
}: {
  row: Row
  last: boolean
  onUpdateStatus?: (id: string, status: Payment["status"]) => void
}) {
  const s = paymentStatusStyles[row.status]
  const actionable = onUpdateStatus && row.status !== "paid"
  return (
    <div
      className={cn(
        "flex min-w-[760px] items-center px-6 py-3.5",
        !last && "border-b border-b-border",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
          <span className="font-sans text-[11px] font-semibold leading-normal text-primary">
            {row.initials}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-foreground">
            {row.name}
          </span>
          <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
            {row.role}
          </span>
        </div>
      </div>
      <span className="w-[130px] font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
        {row.dept}
      </span>
      <span className="w-[110px] text-right font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
        {row.gross}
      </span>
      <span className="w-[110px] text-right font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
        {row.ded}
      </span>
      <span className="w-[110px] text-right font-sans text-[13px] font-semibold leading-normal text-foreground">
        {row.net}
      </span>
      <div className="flex w-[110px] items-center">
        {actionable ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Update status for ${row.name}`}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 font-sans text-[11.5px] font-semibold leading-normal text-secondary-foreground transition-colors hover:bg-muted"
              >
                <span className={`size-1.5 shrink-0 rounded-full ${s.dot}`} />
                {s.label}
                <Ellipsis className="size-3.5 text-muted-foreground" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateStatus?.(row.id, "paid")}>
                Mark as paid
              </DropdownMenuItem>
              {row.status !== "failed" ? (
                <DropdownMenuItem onClick={() => onUpdateStatus?.(row.id, "failed")}>
                  Mark as failed
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
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
        )}
      </div>
    </div>
  )
}
