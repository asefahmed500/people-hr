type ExportColumn<T> = {
  key: keyof T | string
  label: string
  value?: (row: T) => string | number
}

function escapeCsv(value: string): string {
  // Neutralise spreadsheet formula injection: a cell beginning with = + - @
  // (or a control character) is executed by Excel/Sheets when the CSV is
  // opened. Prefixing with an apostrophe keeps it literal text.
  let safe = value.replace(/^[=+\-@\t\r]/, "'$&")
  const needsQuotes = /[",\n]/.test(safe)
  safe = safe.replace(/"/g, '""')
  return needsQuotes ? `"${safe}"` : safe
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
): string {
  const header = columns.map((c) => escapeCsv(c.label)).join(",")
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = c.value ? c.value(row) : (row as Record<string, unknown>)[c.key as string]
          return escapeCsv(String(raw ?? ""))
        })
        .join(","),
    )
    .join("\n")
  return `${header}\n${body}`
}

export function downloadCsv(filename: string, csv: string) {
  if (typeof window === "undefined") return
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: ExportColumn<T>[],
) {
  downloadCsv(filename, toCsv(rows, columns))
}
