"use client"

import * as React from "react"
import { Bold, Italic, Underline, List, ListOrdered, Undo2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { sanitizeLetterHtml } from "@/lib/sanitize-html"
import { Button } from "@/components/ui/button"

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  className?: string
}

const TOOLS = [
  { cmd: "bold", icon: Bold, label: "Bold" },
  { cmd: "italic", icon: Italic, label: "Italic" },
  { cmd: "underline", icon: Underline, label: "Underline" },
  { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
] as const

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  // Sync external value (template generation) into the editor without
  // fighting the user's caret while typing. Sanitized: the value may come
  // from a stored document, not just from this editor.
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const clean = sanitizeLetterHtml(value)
    if (el.innerHTML !== clean) {
      el.innerHTML = clean
    }
  }, [value])

  function exec(cmd: string) {
    ref.current?.focus()
    document.execCommand(cmd)
    onChange(sanitizeLetterHtml(ref.current?.innerHTML ?? ""))
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-[#fafaf8] px-2 py-1.5">
        {TOOLS.map((t) => (
          <Button
            key={t.cmd}
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(t.cmd)}
          >
            <t.icon className="size-3.5" />
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Undo"
          aria-label="Undo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("undo")}
        >
          <Undo2 className="size-3.5" />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Letter body"
        onInput={(e) => onChange(sanitizeLetterHtml((e.target as HTMLDivElement).innerHTML))}
        onBlur={(e) => onChange(sanitizeLetterHtml((e.target as HTMLDivElement).innerHTML))}
        className="letter-editor-body max-h-[420px] min-h-[260px] overflow-y-auto px-5 py-4 text-sm leading-relaxed outline-none [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  )
}
