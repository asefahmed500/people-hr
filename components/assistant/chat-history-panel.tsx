"use client"

import * as React from "react"
import { Ellipsis, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/data"

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return "Just now"
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 24 * 3600_000) return `${Math.round(diff / 3600_000)}h ago`
  if (diff < 48 * 3600_000) return "Yesterday"
  if (diff < 7 * 24 * 3600_000) return `${Math.round(diff / (24 * 3600_000))}d ago`
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

type ChatHistoryPanelProps = {
  onNewChat?: () => void
  onSelectConversation?: (id: string) => void
  onDeleteConversation?: (id: string) => void
  onRenameConversation?: (id: string, title: string) => void
  conversations?: Conversation[]
  activeId?: string | null
}

export function ChatHistoryPanel({
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  conversations,
  activeId,
}: ChatHistoryPanelProps) {
  const items = conversations ?? []
  return (
    <div className="flex h-fit w-full shrink-0 flex-col gap-2 rounded-lg border border-border bg-card p-3 lg:w-[240px]">
      <Button
        type="button"
        variant="outline"
        onClick={onNewChat}
        className="w-full gap-[7px] border-primary text-primary hover:text-primary"
      >
        <Plus className="size-3.5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
        New chat
      </Button>
      <span className="px-0 pb-0 pt-0.5 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[0.09em] text-muted-foreground">
        Recent
      </span>
      {items.length === 0 ? (
        <p className="px-1 py-2 font-sans text-[12px] leading-normal text-muted-foreground">
          No conversations yet.
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {items.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              active={conv.id === activeId}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
              onRename={onRenameConversation}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ConversationRow({
  conv,
  active,
  onSelect,
  onDelete,
  onRename,
}: {
  conv: Conversation
  active: boolean
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
  onRename?: (id: string, title: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [renaming, setRenaming] = React.useState(false)
  const [title, setTitle] = React.useState(conv.title)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  const commitRename = () => {
    onRename?.(conv.id, title)
    setRenaming(false)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative flex items-center gap-1 rounded-lg">
      {renaming ? (
        <form
          className="flex flex-1 items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            commitRename()
          }}
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Conversation title"
            className="h-7 w-full rounded-md border border-border bg-card px-2 font-sans text-[12px] text-foreground outline-none"
          />
          <button type="submit" className="sr-only">
            Save
          </button>
        </form>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSelect?.(conv.id)}
          className={cn(
            "h-auto min-w-0 w-full justify-start gap-2 px-2 py-1.5 text-left text-[12.5px] font-normal",
            active && "bg-foreground/5 text-primary hover:bg-foreground/5",
          )}
        >
          <MessageCircle
            className={cn("size-[13px] shrink-0", active ? "text-primary" : "text-muted-foreground")}
            strokeWidth={2}
          />
          <span className="flex-1 overflow-clip [text-overflow:ellipsis]">{conv.title}</span>
          <span className="shrink-0 text-[10.5px] text-muted-foreground">{timeAgo(conv.updatedAt)}</span>
        </Button>
      )}
      {!renaming ? (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Options for ${conv.title}`}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && open) {
                      e.stopPropagation()
                      setOpen(false)
                    }
                  }}
                >
                  <Ellipsis className="size-3.5" strokeWidth={2} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Conversation options</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {open ? (
            <div
              role="menu"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false)
              }}
              className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTitle(conv.title)
                  setRenaming(true)
                }}
                className="h-auto w-full justify-start gap-2 px-3 py-2 text-[13px] font-normal"
              >
                <Pencil className="size-3.5" strokeWidth={2} />
                Rename
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  onDelete?.(conv.id)
                }}
                className="h-auto w-full justify-start gap-2 px-3 py-2 text-[13px] font-normal"
              >
                <Trash2 className="size-3.5" strokeWidth={2} />
                Delete
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
