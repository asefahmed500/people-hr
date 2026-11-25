"use client"

import { sanitizeLetterHtml } from "@/lib/sanitize-html"

// Print-to-PDF export: renders the document into a hidden iframe with an A4
// print stylesheet and opens the browser's Save-as-PDF dialog. No external
// dependencies, and the output keeps real selectable text.
export function printDocument(
  title: string,
  bodyHtml: string,
  opts?: { companyName?: string; raw?: boolean },
): boolean {
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.style.position = "fixed"
  frame.style.right = "0"
  frame.style.bottom = "0"
  frame.style.width = "0"
  frame.style.height = "0"
  frame.style.border = "0"
  document.body.appendChild(frame)

  const doc = frame.contentDocument
  if (!doc) {
    document.body.removeChild(frame)
    return false
  }

  const safeTitle = title.replace(/[<>&"]/g, "")
  const company = (opts?.companyName ?? "").trim() || "Your Company"
  const escHtml = (s: string) => s.replace(/[<>&"]/g, "")
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { background: #fff; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
    color: #14161a; font-size: 11pt; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    margin: 0; padding: 0;
  }
  .letter-head {
    display: flex; justify-content: space-between; align-items: flex-end;
    border-bottom: 1px solid #14161a; padding-bottom: 10px; margin-bottom: 24px;
  }
  .letter-brand { font-size: 14pt; font-weight: 650; letter-spacing: -0.01em; }
  .letter-brand-sub {
    font-size: 8pt; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.1em; color: #6b7280; margin-top: 2px;
  }
  h1, h2 { font-weight: 650; letter-spacing: -0.01em; break-after: avoid; }
  h1 { font-size: 17pt; margin: 0 0 2px; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.06em; color: #4b5563; margin: 22px 0 6px; }
  p { margin: 0 0 10px; orphans: 2; widows: 2; }
  .muted { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 12px; }
  th, td { padding: 6px 0; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { font-size: 8.5pt; font-weight: 650; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
  td:last-child, th:last-child { text-align: right; }
  .meta td:first-child, .totals td:first-child { font-weight: 600; }
  .totals td { border-bottom: none; }
  .totals .net td { border-top: 1.5px solid #14161a; font-size: 12pt; font-weight: 700; padding-top: 9px; }
  .note { margin-top: 22px; color: #6b7280; font-size: 9.5pt; }
  .foot {
    margin-top: 26px; padding-top: 10px; border-top: 1px solid #e5e7eb;
    color: #6b7280; font-size: 9pt;
  }
  @media print {
    thead { display: table-header-group; }
    tr, blockquote { break-inside: avoid; }
  }
</style></head><body>
<div class="letter-head">
  <div>
    <div class="letter-brand">${escHtml(company)}</div>
    <div class="letter-brand-sub">People Operations</div>
  </div>
</div>
${opts?.raw ? bodyHtml : sanitizeLetterHtml(bodyHtml)}
</body></html>`)
  doc.close()

  // Wait for the iframe to paint, then trigger exactly one print dialog.
  setTimeout(() => {
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    } finally {
      setTimeout(() => document.body.removeChild(frame), 1500)
    }
  }, 200)
  return true
}
