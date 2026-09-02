// Sanitizes HR-letter HTML. The rich-text editor only produces formatting
// tags, so the allowlist is tight: no attributes, no links, no images —
// stored documents (typed OR hand-crafted via the API) can never carry
// scripts, event handlers, or javascript: URLs into the preview or the
// print-to-PDF iframe.
import DOMPurify from "dompurify"

const ALLOWED_TAGS = ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "span", "div"]

export function sanitizeLetterHtml(html: string): string {
  if (!html) return ""
  if (typeof window === "undefined") {
    // No DOM available (SSR / tests) — escape instead of trusting the input.
    return html.replace(
      /[<>&]/g,
      (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c,
    )
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}
