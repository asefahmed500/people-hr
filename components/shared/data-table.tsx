"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
  sortable?: boolean
  sortAccessor?: (row: T) => string | number
}

export type FilterChip<T> = {
  id: string
  label: string
  matcher: (row: T) => boolean
}

export type SortOption<T> = {
  id: string
  label: string
  accessor: (row: T) => string | number
  direction?: "asc" | "desc"
}

type DataTableProps<T> = {
  rows: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  searchKeys: (keyof T)[]
  searchPlaceholder?: string
  filterChips?: FilterChip<T>[]
  sortOptions?: SortOption<T>[]
  pageSize?: number
  onRowClick?: (row: T) => void
  rowMenu?: (row: T) => { label: string; onSelect: (row: T) => void; danger?: boolean }[]
  emptyLabel?: string
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  searchKeys,
  searchPlaceholder = "Searchâ€¦",
  filterChips,
  sortOptions,
  pageSize = 8,
  onRowClick,
  rowMenu,
  emptyLabel = "No matching rows.",
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("")
  const [activeChip, setActiveChip] = React.useState<string | null>(
    filterChips?.[0]?.id ?? null,
  )
  const [sortId, setSortId] = React.useState<string | null>(
    sortOptions?.[0]?.id ?? null,
  )
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    let list = rows
    const chip = filterChips?.find((c) => c.id === activeChip)
    if (chip && chip.id !== filterChips?.[0]?.id) {
      list = list.filter(chip.matcher)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((row) =>
        searchKeys.some((k) =>
          String(row[k] ?? "")
            .toLowerCase()
            .includes(q),
        ),
      )
    }
    if (sortId) {
      const sort = sortOptions?.find((s) => s.id === sortId)
      if (sort) {
        list = [...list].sort((a, b) => {
          const av = sort.accessor(a)
          const bv = sort.accessor(b)
          if (typeof av === "number" && typeof bv === "number") {
            return (sort.direction ?? "asc") === "asc" ? av - bv : bv - av
          }
          const cmp = String(av).localeCompare(String(bv))
          return (sort.direction ?? "asc") === "asc" ? cmp : -cmp
        })
      }
    }
    return list
  }, [rows, query, activeChip, sortId, filterChips, sortOptions, searchKeys])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [query, activeChip, sortId])

  const activeSort = sortOptions?.find((s) => s.id === sortId)

  // A sortable header maps to a sort option by key/id so it drives the exact
  // same sorting path as the dropdown â€” no duplicate sort state to keep in sync.
  const sortOptionForColumn = (column: Column<T>) =>
    sortOptions?.find((s) => s.id === column.key)

  const handleHeaderSort = (column: Column<T>) => {
    const option = sortOptionForColumn(column)
    if (!option) return
    setSortId((current) => (current === option.id ? null : option.id))
  }

  return (
    <div className="flex w-full flex-col overflow-x-auto rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-b-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-9 w-full items-center gap-2 rounded-xl bg-muted px-3.5 sm:w-[264px]">
            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
            <input
              aria-label={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent font-sans text-[13px] leading-normal text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          {filterChips && filterChips.length > 0 ? (
            <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1">
              {filterChips.map((chip) => {
                const count = rows.filter(chip.matcher).length
                const isActive = chip.id === activeChip
                return (
                  <Button
                    key={chip.id}
                    type="button"
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveChip(chip.id)}
                    aria-label={`Filter: ${chip.label} (${count})`}
                    aria-pressed={isActive}
                    className="h-8 min-w-0 shrink-0 gap-1.5 px-3"
                  >
                    <span className={cn("text-[12.5px]", isActive ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {chip.label}
                    </span>
                    <span className="text-[11.5px] font-medium text-muted-foreground">{count}</span>
                  </Button>
                )
              })}
            </div>
          ) : null}
        </div>
        {sortOptions && sortOptions.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Sort rows: ${activeSort ? activeSort.label : "default"}`}
                className="min-w-[104px] self-start sm:self-auto"
              >
                <span>{activeSort ? activeSort.label : "Sort"}</span>
                <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-150 group-hover/button:translate-y-0.5" strokeWidth={2} aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setSortId(opt.id)}
                  className={cn(opt.id === sortId && "bg-muted")}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => setSortId(null)}>
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div role="table" aria-label="Data table">
      <div
        role="row"
        className="hidden items-center border-b border-b-border bg-muted px-6 py-3 md:flex"
      >
        {columns.map((c) => {
          const option = sortOptionForColumn(c)
          const sortable = !!c.sortable && !!option
          const isActive = sortable && sortId === option?.id
          const direction = option?.direction ?? "asc"
          const SortIcon = isActive
            ? direction === "asc"
              ? ArrowUp
              : ArrowDown
            : ArrowUpDown
          return (
            <div
              key={c.key}
              role="columnheader"
              aria-sort={
                sortable
                  ? isActive
                    ? direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined
              }
              className={cn(
                "font-sans text-[11px] font-semibold uppercase leading-normal tracking-[0.6px] text-foreground",
                c.className ?? "min-w-0 flex-1",
              )}
            >
              {sortable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => handleHeaderSort(c)}
                  aria-label={`Sort by ${c.header}${isActive ? `, currently ${direction === "asc" ? "ascending" : "descending"}` : ""}`}
                  className="min-w-0 gap-1.5 px-1 py-0 text-[11px] font-semibold uppercase tracking-[0.06em]"
                >
                  {c.header}
                  <SortIcon className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                </Button>
              ) : (
                c.header
              )}
            </div>
          )
        })}
        {rowMenu ? (
          <div role="columnheader" aria-label="Actions" className="flex w-10 shrink-0" />
        ) : null}
      </div>

      <div className="hidden md:flex md:flex-col">
        {paged.length === 0 ? (
          <div className="px-6 py-10 text-center font-sans text-[13px] text-muted-foreground">
            {emptyLabel}
          </div>
        ) : null}
        {paged.map((row) => (
          <div
            key={getRowId(row)}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            className={cn(
              "flex items-center border-b border-b-border px-6 py-3.5 transition-colors",
              onRowClick && "cursor-pointer hover:bg-muted",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onRowClick(row)
              }
            } : undefined}
          >
            {columns.map((c) => (
              <div key={c.key} className={c.className ?? "min-w-0 flex-1"}>
                {c.render(row)}
              </div>
            ))}
            {rowMenu ? (
              <div className="flex w-10 shrink-0 justify-end">
                <RowMenu row={row} items={rowMenu(row)} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      </div>

      <div className="flex flex-col gap-2 p-4 md:hidden">
        {paged.length === 0 ? (
          <div className="py-8 text-center font-sans text-[13px] text-muted-foreground">
            {emptyLabel}
          </div>
        ) : null}
        {paged.map((row) => (
          <div
            key={getRowId(row)}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            className={cn(
              "rounded-xl border border-border bg-muted p-4",
              onRowClick && "cursor-pointer active:bg-muted",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onRowClick(row)
              }
            } : undefined}
          >
            {columns.map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between gap-2 py-0.5"
              >
                <span className="font-sans text-[11px] uppercase tracking-[0.4px] text-muted-foreground">
                  {c.header}
                </span>
                <span className="min-w-0 flex-1 text-right">
                  {c.render(row)}
                </span>
              </div>
            ))}
            {rowMenu ? (
              <div className="mt-2 flex justify-end">
                <RowMenu row={row} items={rowMenu(row)} />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-t-border bg-muted px-6 py-4 sm:flex-row">
        <span className="font-sans text-[13px] leading-normal text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}â€“
          {Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1.5">
          <PagerButton
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            ariaLabel="Previous page"
          >
            <PaginationChevronLeft />
          </PagerButton>
          {(() => {
            const maxButtons = 5
            let start = Math.max(1, safePage - 2)
            const end = Math.min(pageCount, start + maxButtons - 1)
            start = Math.max(1, end - maxButtons + 1)
            const pages: number[] = []
            for (let p = start; p <= end; p++) pages.push(p)
            return pages.map((pageNum) => (
              <Button
                key={pageNum}
                type="button"
                variant={pageNum === safePage ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setPage(pageNum)}
                aria-label={`Page ${pageNum}`}
                aria-current={pageNum === safePage ? "page" : undefined}
                className="size-[34px] text-[13px]"
              >
                {pageNum}
              </Button>
            ))
          })()}
          <PagerButton
            disabled={safePage === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            ariaLabel="Next page"
          >
            <PaginationChevronRight />
          </PagerButton>
        </div>
      </div>
    </div>
  )
}

function RowMenu<T>({
  row,
  items,
}: {
  row: T
  items: { label: string; onSelect: (row: T) => void; danger?: boolean }[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Row actions"
          className="size-[30px]"
          onClick={(e) => e.stopPropagation()}
        >
          <Ellipsis className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={(e) => {
              e.stopPropagation()
              item.onSelect(row)
            }}
            className={cn(item.danger && "text-destructive focus:text-destructive")}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="size-[34px] text-muted-foreground"
    >
      {children}
    </Button>
  )
}

function PaginationChevronLeft() {
  return <ChevronLeft className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
}

function PaginationChevronRight() {
  return <ChevronRight className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
}
