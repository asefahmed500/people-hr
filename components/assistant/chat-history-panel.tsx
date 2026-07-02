import { MessageCircle, Plus } from "lucide-react"

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
  conversations?: Conversation[]
  activeId?: string | null
}

export function ChatHistoryPanel({ onNewChat, onSelectConversation, conversations, activeId }: ChatHistoryPanelProps) {
  const items = conversations ?? []
  return (
    <div className="flex h-fit w-[240px] shrink-0 flex-col gap-2.5 rounded-[14px] border border-[#e8ebe6] bg-white p-3.5">
      <button
        type="button"
        onClick={onNewChat}
        className="flex w-full items-center justify-center gap-[7px] rounded-[10px] border border-[#2f6f61] px-3 py-[9px]"
      >
        <Plus className="size-3.5 shrink-0 text-[#2f6f61]" strokeWidth={2} />
        <span className="font-sans text-[13px] font-semibold leading-normal text-[#2f6f61]">
          New chat
        </span>
      </button>
      <span className="px-0 pb-0 pt-0.5 font-sans text-[10.5px] font-semibold uppercase leading-normal tracking-[1.4px] text-[#b0b7af]">
        Recent
      </span>
      <div className="flex flex-col gap-0.5">
        {items.map((conv) => (
          <ConversationRow key={conv.id} conv={conv} active={conv.id === activeId} onSelect={onSelectConversation} />
        ))}
      </div>
    </div>
  )
}

function ConversationRow({ conv, active, onSelect }: { conv: Conversation; active: boolean; onSelect?: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(conv.id)}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-[7px] text-left",
        active && "bg-[#2f6f6108]",
      )}
    >
      <MessageCircle
        className={cn(
          "size-[13px] shrink-0",
          active ? "text-[#2f6f61]" : "text-[#b0b7af]",
        )}
        strokeWidth={2}
      />
      <span
        className={cn(
          "flex-1 overflow-clip font-sans text-[12.5px] leading-normal [text-overflow:ellipsis]",
          active
            ? "font-medium text-[#2f6f61]"
            : "text-[#42504a]",
        )}
      >
        {conv.title}
      </span>
      <span className="shrink-0 font-sans text-[10.5px] leading-normal text-[#b0b7af]">
        {timeAgo(conv.updatedAt)}
      </span>
    </button>
  )
}
