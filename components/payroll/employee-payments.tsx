import { Ellipsis } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Payment } from "@/lib/data"
import { formatMoney, paymentStatusStyles } from "@/lib/data"
import { cn } from "@/lib/utils"

function mapPaymentToRow(p: Payment) {
  const net = p.gross - p.deductions
  return {
    id: p.id,
    initials: p.initials,
    name: p.name,
    role: p.role,
    dept: p.department,
    period: p.period ?? "legacy",
    gross: formatMoney(p.gross, p.currency),
    ded: formatMoney(p.deductions, p.currency),
    net: formatMoney(net, p.currency),
    status: p.status,
  }
}

const headClass =
  "font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.7px] text-muted-foreground"

export function EmployeePayments({
  payments,
  onUpdateStatus,
}: {
  payments?: Payment[]
  onUpdateStatus?: (id: string, status: Payment["status"]) => void
}) {
  const rows = (payments ?? []).map(mapPaymentToRow)

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Employee payments
          </h2>
          <span className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            {payments?.length ?? 0} payment records · recorded only, no money sent
          </span>
        </div>
      </div>
      <Table className="min-w-[860px]">
        <TableHeader className="[&_th]:bg-muted [&_th]:hover:bg-muted">
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className={cn(headClass, "pl-4")}>Employee</TableHead>
            <TableHead className={cn(headClass, "w-[130px]")}>Department</TableHead>
            <TableHead className={cn(headClass, "w-[90px]")}>Period</TableHead>
            <TableHead className={cn(headClass, "w-[110px] text-right")}>Gross</TableHead>
            <TableHead className={cn(headClass, "w-[110px] text-right")}>Deductions</TableHead>
            <TableHead className={cn(headClass, "w-[110px] text-right")}>Net</TableHead>
            <TableHead className={cn(headClass, "w-[110px]")}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="py-10 text-center">
                <span className="font-sans text-[13px] leading-normal text-muted-foreground">
                  No payment records
                </span>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <PaymentRow
                key={row.id}
                row={row}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

type Row = ReturnType<typeof mapPaymentToRow>

function PaymentRow({
  row,
  onUpdateStatus,
}: {
  row: Row
  onUpdateStatus?: (id: string, status: Payment["status"]) => void
}) {
  const s = paymentStatusStyles[row.status]
  const actionable = onUpdateStatus && row.status !== "paid"

  const statusBadge = (
    <Badge
      variant="secondary"
      className={cn("h-6 gap-1 text-[11px]", s.bg, s.text)}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {s.label}
    </Badge>
  )

  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-foreground/10 text-[11px] font-semibold text-primary">
              {row.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-foreground">
              {row.name}
            </span>
            <span className="font-sans inline-block text-[11.5px] leading-normal text-muted-foreground">
              {row.role}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[130px] font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
        {row.dept}
      </TableCell>
      <TableCell className="w-[90px] font-sans text-[12px] leading-normal text-muted-foreground">
        {row.period}
      </TableCell>
      <TableCell className="w-[110px] text-right font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
        {row.gross}
      </TableCell>
      <TableCell className="w-[110px] text-right font-sans text-[13px] font-medium leading-normal text-secondary-foreground">
        {row.ded}
      </TableCell>
      <TableCell className="w-[110px] text-right font-sans text-[13px] font-semibold leading-normal text-foreground">
        {row.net}
      </TableCell>
      <TableCell className="w-[110px]">
        {actionable ? (
          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      aria-label={`Update status for ${row.name}`}
                      className="h-7 min-w-0 gap-1 rounded-lg px-2"
                    >
                      {statusBadge}
                      <Ellipsis className="size-3.5 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Update status</TooltipContent>
              </Tooltip>
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
          </TooltipProvider>
        ) : (
          statusBadge
        )}
      </TableCell>
    </TableRow>
  )
}
