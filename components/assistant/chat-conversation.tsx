"use client"

import * as React from "react"
import { BotMessageSquare, Send } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ChatMessage } from "@/lib/data"

type ChatConversationProps = {
  messages?: ChatMessage[]
  suggestedPrompts?: string[]
  thinking?: boolean
  onSendMessage?: (msg: string) => void
  onSelectPrompt?: (prompt: string) => void
}

const DEFAULT_PROMPTS = [
  "Summarize this month’s hiring",
  "Who is up for review?",
  "Explain our parental leave policy",
  "Forecast next quarter’s headcount",
]

export function ChatConversation({
  messages,
  suggestedPrompts,
  thinking = false,
  onSendMessage,
  onSelectPrompt,
}: ChatConversationProps) {
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const msgs = messages ?? []
  const prompts = suggestedPrompts ?? DEFAULT_PROMPTS

  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs.length])

  const handleSend = () => {
    const msg = input.trim()
    if (!msg || thinking) return
    onSendMessage?.(msg)
    setInput("")
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div ref={scrollRef} className="flex max-h-[480px] min-h-[320px] flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {msgs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="font-sans text-[13.5px] leading-normal text-muted-foreground">
              Start a conversation by typing a message below or choosing a prompt.
            </p>
            <div className="flex flex-col gap-2">
              {prompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectPrompt?.(prompt)}
                  disabled={thinking}
                  className="h-auto min-w-0 justify-start px-3 py-2 text-left text-[12.5px] font-normal"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          msgs.map((msg) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} text={msg.content} />
            ) : (
              <AssistantMessage key={msg.id} text={msg.content} thinking={msg.content === "Thinking…"} />
            ),
          )
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask PeopleHR AI anything…"
          disabled={thinking}
          aria-label="Message"
          className="flex-1 border-0 bg-transparent font-sans text-[13.5px] leading-normal text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <Badge variant="outline" className="h-5 shrink-0 gap-1 bg-muted">
          <BotMessageSquare className="size-3 text-primary" strokeWidth={2} aria-hidden="true" />
          <span className="text-[10px] font-semibold leading-none text-secondary-foreground">
            PeopleHR AI
          </span>
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                aria-label="Send message"
                onClick={handleSend}
                disabled={thinking || !input.trim()}
                className="shrink-0 rounded-lg"
              >
                <Send className="size-4" strokeWidth={2} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span className="text-center font-sans text-[11px] leading-normal text-muted-foreground">
        AI can make mistakes. Verify important info.
      </span>
    </div>
  )
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[70%] flex-col rounded-tr bg-primary px-4 py-2.5">
        <span className="font-sans text-[13.5px] leading-[1.55] text-primary-foreground">
          {text}
        </span>
      </div>
    </div>
  )
}

function AssistantMessage({ text, thinking }: { text: string; thinking: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar className="size-[30px]">
        <AvatarFallback className="bg-foreground/10">
          <BotMessageSquare className="size-3.5 text-primary" strokeWidth={1.8} aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
      <div className="flex max-w-[78%] flex-col rounded-tl border border-border bg-card px-4 py-3">
        {thinking ? (
          <span className="flex items-center gap-1 py-0.5">
            <span className="size-1.5 animate-bounce rounded-full bg-primary" />
            <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
          </span>
        ) : (
          <Markdown text={text} />
        )}
      </div>
    </div>
  )
}

// Minimal markdown-lite: paragraphs + **bold** + `code`.
function Markdown({ text }: { text: string }) {
  const parts = text.split(/\n{2,}/)
  return (
    <div className="flex flex-col gap-2">
      {parts.map((block, i) => (
        <p key={i} className="font-sans text-[13.5px] leading-[1.6] text-foreground">
          <Inline text={block} />
        </p>
      ))}
    </div>
  )
}

function Inline({ text }: { text: string }) {
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {seg.slice(2, -2)}
            </strong>
          )
        }
        if (seg.startsWith("`") && seg.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">
              {seg.slice(1, -1)}
            </code>
          )
        }
        return <React.Fragment key={i}>{seg}</React.Fragment>
      })}
    </>
  )
}
