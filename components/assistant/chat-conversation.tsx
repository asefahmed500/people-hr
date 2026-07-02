import * as React from "react"
import { Paperclip, Sparkles } from "lucide-react"

import { notify } from "@/lib/toast"
import type { ChatMessage } from "@/lib/data"

type ChatConversationProps = {
  messages?: ChatMessage[]
  suggestedPrompts?: string[]
  onSendMessage?: (msg: string) => void
  onSelectPrompt?: (prompt: string) => void
}

export function ChatConversation({ messages, suggestedPrompts, onSendMessage, onSelectPrompt }: ChatConversationProps) {
  const [input, setInput] = React.useState("")
  const msgs = messages ?? []
  const prompts = suggestedPrompts ?? [
    "Summarize this month’s hiring",
    "Who is up for review?",
    "Explain our parental leave policy",
    "Forecast Q2 headcount",
  ]

  const handleSend = () => {
    const msg = input.trim()
    if (!msg) return
    onSendMessage?.(msg)
    setInput("")
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
    onSelectPrompt?.(prompt)
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 rounded-[14px] border border-[#e8ebe6] bg-white p-6">
      <div className="flex flex-1 flex-col gap-5">
        {msgs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-sans text-[13.5px] leading-normal text-[#8a948d]">
              Start a conversation by typing a message below or choosing a prompt.
            </p>
          </div>
        ) : (
          msgs.map((msg) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} text={msg.content} />
            ) : (
              <AssistantSimple key={msg.id} text={msg.content} />
            ),
          )
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2.5 rounded-[12px] border border-[#e8ebe6] bg-white px-3.5 py-2.5">
        <button type="button" onClick={() => notify.info("File upload coming soon")} aria-label="Attach file">
          <Paperclip className="size-4 shrink-0 text-[#8a948d]" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AetherPeople AI anything…"
          className="flex-1 border-0 bg-transparent font-sans text-[13.5px] leading-normal text-[#1f2a26] outline-none placeholder:text-[#b0b7af]"
        />
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e8ebe6] bg-[#f8f7f4] px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-[#2f6f61]" />
          <span className="font-sans text-[11px] font-semibold leading-normal text-[#5b655e]">
            Claude 4.7
          </span>
        </span>
        <button
          type="button"
          aria-label="Send message"
          onClick={handleSend}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2f6f61]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 text-white"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2z" />
          </svg>
        </button>
      </div>
      <span className="text-center font-sans text-[11px] leading-normal text-[#b0b7af]">
        AI can make mistakes. Verify important info.
      </span>
    </div>
  )
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[70%] flex-col rounded-tr bg-[#2f6f61] px-4 py-2.5">
        <span className="font-sans text-[13.5px] leading-[1.55] text-white">
          {text}
        </span>
      </div>
    </div>
  )
}

function AssistantSimple({ text, followUp }: { text: string; followUp?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#2f6f611a]">
        <Sparkles className="size-3.5 text-[#2f6f61]" strokeWidth={1.8} />
      </div>
      <div className="flex max-w-[78%] flex-col gap-2.5 rounded-tl border border-[#e8ebe6] bg-white px-4 py-3">
        <p className="font-sans text-[13.5px] leading-[1.6] text-[#1f2a26]">
          {text}
        </p>
        {followUp ? (
          <p className="font-sans text-[13px] leading-normal text-[#5b655e]">
            {followUp}
          </p>
        ) : null}
      </div>
    </div>
  )
}


