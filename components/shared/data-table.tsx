"use client"

import * as React from "react"
import { ChevronDown, Ellipsis, Search } from "lucide-react"

import { cn } from "@/lib/utils"
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
  searchPlaceholder = "Search…",
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
    setPage(1)
  }, [query, activeChip, sortId])

  const activeSort = sortOptions?.find((s) => s.id === sortId)

  return (
    <div className="flex w-full flex-col overflow-clip rounded-[18px] border border-[#ece9e2] bg-white shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <div className="flex flex-col gap-3 border-b border-b-[#edeae3] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-10 w-full items-center gap-2 rounded-xl bg-[#f5f3ee] px-3.5 sm:w-[264px]">
            <Search className="size-4 shrink-0 text-[#a2aaa3]" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent font-sans text-[13px] leading-normal text-[#1f2a26] outline-none placeholder:text-[#9aa39c]"
            />
          </div>
          {filterChips && filterChips.length > 0 ? (
            <div className="flex items-center gap-1 overflow-x-auto rounded-[11px] bg-[#f1efea] p-1">
              {filterChips.map((chip) => {
                const count = rows.filter(chip.matcher).length
                const isActive = chip.id === activeChip
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveChip(chip.id)}
                    className={cn(
                      "flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 py-0",
                      isActive ? "bg-white shadow-sm" : "",
                    )}
                  >
                    <span
                      className={cn(
                        "font-sans text-[12.5px] leading-normal",
                        isActive
                          ? "font-semibold text-[#1f2a26]"
                          : "font-medium text-[#6b7770]",
                      )}
                    >
                      {chip.label}
                    </span>
                    <span className="font-sans text-[11.5px] font-medium leading-normal text-[#8a948d]">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
        {sortOptions && sortOptions.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-[38px] items-center gap-2 self-start rounded-[10px] border border-[#e7e4dd] bg-white px-3.5 sm:self-auto"
              >
                <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
                  {activeSort ? activeSort.label : "Sort"}
                </span>
                <ChevronDown className="size-3.5 text-[#8a948d]" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setSortId(opt.id)}
                  className={cn(opt.id === sortId && "bg-[#f6f4ef]")}
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

      <div className="hidden items-center border-b border-b-[#edeae3] bg-[#faf9f6] px-6 py-3 md:flex">
        {columns.map((c) => (
          <div
            key={c.key}
            className={cn(
              "font-sans text-[11px] font-semibold uppercase leading-normal tracking-[0.6px] text-[#8a948d]",
              c.className ?? "min-w-0 flex-1",
            )}
          >
            {c.header}
          </div>
        ))}
        {rowMenu ? <div className="flex w-10 shrink-0" /> : null}
      </div>

      <div className="hidden md:flex md:flex-col">
        {paged.length === 0 ? (
          <div className="px-6 py-10 text-center font-sans text-[13px] text-[#8a948d]">
            {emptyLabel}
          </div>
        ) : null}
        {paged.map((row) => (
          <div
            key={getRowId(row)}
            className={cn(
              "flex items-center border-b border-b-[#f2efe9] px-6 py-3.5 transition-colors",
              onRowClick && "cursor-pointer hover:bg-[#faf9f6]",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
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

      <div className="flex flex-col gap-2 p-4 md:hidden">
        {paged.length === 0 ? (
          <div className="py-8 text-center font-sans text-[13px] text-[#8a948d]">
            {emptyLabel}
          </div>
        ) : null}
        {paged.map((row) => (
          <div
            key={getRowId(row)}
            className={cn(
              "rounded-xl border border-[#edeae3] bg-[#faf9f6] p-4",
              onRowClick && "cursor-pointer active:bg-[#f1eee8]",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between gap-2 py-0.5"
              >
                <span className="font-sans text-[11px] uppercase tracking-[0.4px] text-[#a6aca3]">
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

      <div className="flex flex-col items-center justify-between gap-3 border-t border-t-[#edeae3] bg-[#faf9f6] px-6 py-4 sm:flex-row">
        <span className="font-sans text-[13px] leading-normal text-[#6b7770]">
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
          {Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1.5">
          <PagerButton
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            ariaLabel="Previous page"
          >
            <ChevronLeft />
          </PagerButton>
          {Array.from({ length: pageCount }).slice(0, 5).map((_, i) => {
            const pageNum = i + 1
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                className={cn(
                  "flex size-[34px] items-center justify-center rounded-[9px] border border-[#e7e4dd] bg-white font-sans text-[13px] font-medium leading-normal text-[#42504a]",
                  pageNum === safePage &&
                    "border-0 bg-[#2f6f61] font-semibold text-white",
                )}
              >
                {pageNum}
              </button>
            )
          })}
          <PagerButton
            disabled={safePage === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            ariaLabel="Next page"
          >
            <ChevronRight />
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
        <button
          type="button"
          aria-label="Row actions"
          className="flex size-[30px] items-center justify-center rounded-[9px] bg-[#f3f1ec] hover:bg-[#edeae3]"
          onClick={(e) => e.stopPropagation()}
        >
          <Ellipsis className="size-4 text-[#8a948d]" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={(e) => {
              e.stopPropagation()
              item.onSelect(row)
            }}
            className={cn(item.danger && "text-[#c4553a] focus:text-[#c4553a]")}
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
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex size-[34px] items-center justify-center rounded-[9px] border border-[#e7e4dd] bg-white text-[#8a948d] disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-[#5b655e]"
    >
      <path d="M15 6l-6 6l6 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-[#5b655e]"
    >
      <path d="M9 6l6 6l-6 6" />
    </svg>
  )
}
