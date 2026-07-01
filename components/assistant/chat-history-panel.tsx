import { MessageCircle, Plus } from "lucide-react"

import { cn } from "@/lib/utils"

type Conversation = {
  title: string
  time: string
  active?: boolean
}

const conversations: Conversation[] = [
  { title: "Attrition risk in Sales", time: "2h ago", active: true },
  { title: "Draft offer letter", time: "Yesterday" },
  { title: "PTO policy summary", time: "Mon" },
  { title: "Headcount forecast Q2", time: "Fri" },
  { title: "Comp band for L5 eng", time: "Mar 5" },
]

export function ChatHistoryPanel() {
  return (
    <div className="flex h-fit w-[240px] shrink-0 flex-col gap-2.5 rounded-[14px] border border-[#e8ebe6] bg-white p-3.5">
      <button
        type="button"
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
        {conversations.map((conv) => (
          <ConversationRow key={conv.title} conv={conv} />
        ))}
      </div>
    </div>
  )
}

function ConversationRow({ conv }: { conv: Conversation }) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-[7px] text-left",
        conv.active && "bg-[#2f6f6108]",
      )}
    >
      <MessageCircle
        className={cn(
          "size-[13px] shrink-0",
          conv.active ? "text-[#2f6f61]" : "text-[#b0b7af]",
        )}
        strokeWidth={2}
      />
      <span
        className={cn(
          "flex-1 overflow-clip font-sans text-[12.5px] leading-normal [text-overflow:ellipsis]",
          conv.active
            ? "font-medium text-[#2f6f61]"
            : "text-[#42504a]",
        )}
      >
        {conv.title}
      </span>
      <span className="shrink-0 font-sans text-[10.5px] leading-normal text-[#b0b7af]">
        {conv.time}
      </span>
    </button>
  )
}
