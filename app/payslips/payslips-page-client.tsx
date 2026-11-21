"use client"

import * as React from "react"
import { Plus, Printer, Search } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PayslipList } from "@/components/payslips/payslip-list"
import { PayslipPreview } from "@/components/payslips/payslip-preview"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApiStore } from "@/hooks/use-api-store"
import { useAuth } from "@/hooks/use-auth"
import { notify } from "@/lib/toast"
import { printDocument } from "@/lib/print-document"
import {
  buildPayslip,
  buildPayslipHtml,
  currentPeriod,
  defaultPayslipsStore,
  formatPayslipMoney,
  grossPay,
  netPay,
  periodLabel,
  type Payslip,
  type PayslipsStore,
} from "@/lib/data/payslips"
import type { Employee } from "@/lib/data/employees"
import type { PayrollStore } from "@/lib/data/payroll"

export function PayslipsPageClient() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const { state, setState, hydrated, error, retry } = useApiStore<PayslipsStore>(
    "/api/store/payslips",
    () => defaultPayslipsStore,
  )
  const employees = useApiStore<Employee[]>("/api/store/employees", () => [])
  const payroll = useApiStore<PayrollStore>("/api/store/payroll", () => ({
    payments: [],
    lastRun: null,
  }))
  const organization = useApiStore<{ companyName?: string }>(
    "/api/store/organization",
    () => ({ companyName: "", departments: [], offices: [], orgChart: [] }),
  )
  const companyName = organization.state.companyName?.trim() ?? ""

  const [period, setPeriod] = React.useState(currentPeriod)
  const [periodFilter, setPeriodFilter] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [generateOpen, setGenerateOpen] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [preview, setPreview] = React.useState<Payslip | null>(null)

  const allHydrated =
    hydrated && employees.hydrated && payroll.hydrated && organization.hydrated

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...state.payslips]
      .filter((p) => periodFilter === "all" || p.period === periodFilter)
      .filter((p) => !q || p.employeeName.toLowerCase().includes(q) || p.period.includes(q))
      .sort((a, b) => b.period.localeCompare(a.period) || a.employeeName.localeCompare(b.employeeName))
  }, [state.payslips, query, periodFilter])

  const periods = React.useMemo(
    () => [...new Set(state.payslips.map((p) => p.period))].sort().reverse(),
    [state.payslips],
  )

  const totals = React.useMemo(
    () => ({
      count: visible.length,
      gross: visible.reduce((s, p) => s + grossPay(p.earnings), 0),
      net: visible.reduce((s, p) => s + netPay(p), 0),
    }),
    [visible],
  )

  function openGenerate() {
    const eligible = payroll.state.payments.map((payment) =>
      employees.state.find(
        (e) => e.id === payment.id || `pay-${e.id}` === payment.id || e.name === payment.name,
      ),
    )
    setSelectedIds(
      eligible.filter((e): e is Employee => !!e).map((e) => e.id),
    )
    setGenerateOpen(true)
  }

  function generate() {
    const chosen = employees.state.filter((e) => selectedIds.includes(e.id))
    if (chosen.length === 0) {
      notify.error("No employees selected", "Select at least one employee to generate a payslip.")
      return
    }
    setGenerating(true)
    const created = chosen.flatMap((employee) => {
      const payment = payroll.state.payments.find(
        (p) => p.id === `pay-${employee.id}` || p.id === employee.id || p.name === employee.name,
      )
      if (!payment) return []
      const existing = state.payslips.some(
        (p) => p.employeeId === employee.id && p.period === period,
      )
      if (existing) return []
      return [buildPayslip(employee, payment, period)]
    })
    setState((prev) => ({ payslips: [...created, ...prev.payslips] }))
    setGenerating(false)
    setGenerateOpen(false)
    if (created.length === 0) {
      notify.info("Nothing to generate", "Those payslips already exist for this period.")
    } else {
      notify.success("Payslips generated", `${created.length} statement(s) created for ${periodLabel(period)}.`)
    }
  }

  function print(p: Payslip) {
    // Payslip HTML is generated here from escaped values and contains tables
    // that the letter-only sanitizer would strip Ã¢â‚¬â€ print it verbatim.
    const ok = printDocument(`${p.employeeName} Ã¢â‚¬â€ ${periodLabel(p.period)}`, buildPayslipHtml(p, companyName), {
      companyName,
      raw: true,
    })
    if (!ok) notify.error("CouldnÃ¢â‚¬â„¢t open print preview", "Please allow pop-ups and try again.")
  }

  const eligibleEmployees = payroll.state.payments
    .map((payment) =>
      employees.state.find((e) => e.id === payment.id || e.name === payment.name),
    )
    .filter((e): e is Employee => !!e)

  return (
    <DashboardShell activeHref="/payslips" current="Payslips" accentCurrent>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-foreground">Payslips</h1>
          <p className="font-sans text-[13px] leading-normal text-secondary-foreground">
            {isAdmin
              ? "Generate and issue monthly salary statements from your payroll data."
              : "Your salary statements, newest first."}
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={openGenerate} disabled={!allHydrated}>
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Generate payslips
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: "Statements", value: String(totals.count) },
          { label: "Gross total", value: formatPayslipMoney(totals.gross) },
          { label: "Net total", value: formatPayslipMoney(totals.net) },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4"
          >
            <span className="font-sans text-[11px] font-medium text-muted-foreground">
              {kpi.label}
            </span>
            <span className="font-sans text-[20px] font-semibold tabular-nums text-foreground">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          <input
            aria-label="Search payslips"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by employee or period"
            className="min-w-0 flex-1 bg-transparent font-sans text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </label>
        {periods.length > 0 ? (
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger aria-label="Filter by period" className="h-9 font-sans text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All periods</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>
                  {periodLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {error || employees.error || payroll.error || organization.error ? (
        <StoreErrorState
          onRetry={() => {
            retry()
            employees.retry()
            payroll.retry()
            organization.retry()
          }}
          description="We couldnÃ¢â‚¬â„¢t load payslips or the data needed to generate them. Check your connection and try again."
        />
      ) : !allHydrated ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : preview ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setPreview(null)}>
              Back to list
            </Button>
            <Button onClick={() => print(preview)}>
              <Printer className="size-4" strokeWidth={2} aria-hidden="true" />
              Print / Save PDF
            </Button>
          </div>
          <PayslipPreview payslip={preview} companyName={companyName} />
        </div>
      ) : (
        <PayslipList payslips={visible} onPreview={setPreview} />
      )}

      <ActionDialog width="wide"
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        title="Generate payslips"
        description={`Create salary statements for ${periodLabel(period)} from current payroll records.`}
        submitLabel={generating ? "GeneratingÃ¢â‚¬Â¦" : "Generate"}
        submitting={generating}
        onSubmit={generate}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-xs font-medium text-muted-foreground">Payroll period</span>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 font-sans text-[13px] text-foreground"
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="font-sans text-xs font-medium text-muted-foreground">
              Employees with payroll records
            </legend>
            {eligibleEmployees.length === 0 ? (
              <p className="font-sans text-[12px] text-muted-foreground">
                No payroll payments yet. Add payments on the Payroll page first.
              </p>
            ) : (
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
                {eligibleEmployees.map((e) => (
                  <label
                    key={e.id}
                    className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 font-sans text-[12.5px] hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedIds.includes(e.id)}
                      onCheckedChange={(checked) =>
                        setSelectedIds((prev) =>
                          checked === true
                            ? [...prev, e.id]
                            : prev.filter((id) => id !== e.id),
                        )
                      }
                    />
                    <span className="text-foreground">{e.name}</span>
                    <span className="ml-auto text-muted-foreground">{e.department}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </div>
      </ActionDialog>
    </DashboardShell>
  )
}
