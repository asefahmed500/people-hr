"use client"

import { sanitizeLetterHtml } from "@/lib/sanitize-html"

// Print-to-PDF export: renders the letter into a hidden iframe with print
// styles and opens the browser's Save-as-PDF dialog. No external deps needed
// and the output keeps real selectable text.
export function printDocument(
  title: string,
  bodyHtml: string,
  opts?: { companyName?: string },
): boolean {
  const frame = document.createElement("iframe")
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
  @page { size: A4; margin: 22mm 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #111; font-size: 12.5pt; line-height: 1.65;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    margin: 0; padding: 0;
  }
  .letter-head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 26px; }
  .letter-brand { font-size: 17pt; font-weight: 600; letter-spacing: -0.02em; }
  .letter-brand-sub { font-size: 9pt; color: #555; margin-top: 2px; }
  .letter-ref { font-size: 9.5pt; color: #444; text-align: right; }
  p { margin: 0 0 12px; }
  ul, ol { margin: 0 0 12px; padding-left: 22px; }
  strong { font-weight: 600; }
  @media print { body { margin: 0; } }
</style></head><body>
<div class="letter-head">
  <div>
    <div class="letter-brand">${escHtml(company)}</div>
    <div class="letter-brand-sub">People Operations</div>
  </div>
</div>
${sanitizeLetterHtml(bodyHtml)}
<script>window.onload=function(){setTimeout(function(){window.print()},120)}<\/script>
</body></html>`)
  doc.close()

  // Give the frame a moment to render, then clean up after printing.
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
