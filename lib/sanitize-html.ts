// Sanitizes HR-letter HTML. The rich-text editor only produces formatting
// tags, so the allowlist is tight: no links, no images, no scripts. A small
// set of presentation styles is retained so generated letters keep their
// right-aligned date and subject blocks in both the preview and the PDF.
import DOMPurify from "dompurify"

const ALLOWED_TAGS = ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "span", "div"]
const ALLOWED_STYLE_PROPS = new Set([
  "text-align",
  "font-weight",
  "font-style",
  "text-decoration",
  "margin",
  "margin-top",
  "margin-bottom",
  "padding",
  "color",
])
const SAFE_VALUE = /^[a-z0-9#%,.\s-]+$/i

function keepSafeStyles(html: string): string {
  return html.replace(/ style="([^"]*)"/gi, (full, value: string) => {
    const safe = value
      .split(";")
      .map((declaration) => declaration.trim().toLowerCase())
      .filter(Boolean)
      .filter((declaration) => {
        const colon = declaration.indexOf(":")
        if (colon < 0) return false
        const prop = declaration.slice(0, colon).trim()
        const val = declaration.slice(colon + 1).trim()
        return ALLOWED_STYLE_PROPS.has(prop) && SAFE_VALUE.test(val)
      })
      .join("; ")
    return safe ? ` style="${safe}"` : ""
  })
}

export function sanitizeLetterHtml(html: string): string {
  if (!html) return ""
  if (typeof window === "undefined") {
    // No DOM available (SSR / tests) — escape instead of trusting the input.
    return html.replace(
      /[<>&]/g,
      (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c,
    )
  }
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["style"],
    KEEP_CONTENT: true,
  })
  return keepSafeStyles(clean)
}
