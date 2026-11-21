"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AssistantHeader } from "@/components/assistant/assistant-header"
import { ChatHistoryPanel } from "@/components/assistant/chat-history-panel"
import { ChatConversation } from "@/components/assistant/chat-conversation"
import { Skeleton } from "@/components/ui/skeleton"
import { StoreErrorState } from "@/components/shared/store-error-state"
import { useApiStore } from "@/hooks/use-api-store"
import { apiRequest } from "@/lib/api-client"
import { consumePendingAction, onAction } from "@/lib/command-actions"
import {
  type AssistantStore,
  type Conversation,
  type ChatMessage,
  defaultAssistantStore,
  suggestedPrompts,
} from "@/lib/data"

const uid = () => Math.random().toString(36).substring(2, 10)

export function AssistantPageClient() {
  const { state, setState, hydrated, error, retry } = useApiStore<AssistantStore>(
    "/api/store/assistant",
    () => defaultAssistantStore,
  )
  const [thinking, setThinking] = React.useState(false)

  const activeConversation = state.conversations.find((c) => c.id === state.activeId) ?? null

  function handleNewChat() {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: "New conversation",
      updatedAt: Date.now(),
      messages: [],
    }
    setState((prev) => ({
      conversations: [newConv, ...prev.conversations],
      activeId: newConv.id,
    }))
  }

  function handleSelectConversation(id: string) {
    setState((prev) => ({ ...prev, activeId: id }))
  }

  function handleDeleteConversation(id: string) {
    setState((prev) => {
      const conversations = prev.conversations.filter((c) => c.id !== id)
      return {
        conversations,
        activeId: prev.activeId === id ? (conversations[0]?.id ?? null) : prev.activeId,
      }
    })
  }

  function handleRenameConversation(id: string, title: string) {
    const clean = title.trim()
    if (!clean) return
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? { ...c, title: clean, updatedAt: Date.now() } : c,
      ),
    }))
  }

  function handleSendMessage(msg: string) {
    const clean = msg.trim()
    if (!clean || thinking) return
    const userMsg: ChatMessage = { id: uid(), role: "user", content: clean, ts: Date.now() }
    const thinkId = uid()
    const thinkMsg: ChatMessage = { id: thinkId, role: "assistant", content: "Thinking…", ts: Date.now() + 300 }

    const history = activeConversation?.messages
      .filter((m) => m.content !== "Thinking…")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content })) ?? []

    setState((prev) => {
      const targetId = prev.activeId
      if (targetId) {
        return {
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === targetId
              ? {
                  ...c,
                  title: c.messages.length === 0 ? clean.slice(0, 30) : c.title,
                  updatedAt: Date.now(),
                  messages: [...c.messages, userMsg, thinkMsg],
                }
              : c,
          ),
        }
      }
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: clean.slice(0, 30),
        updatedAt: Date.now(),
        messages: [userMsg, thinkMsg],
      }
      return { conversations: [newConv, ...prev.conversations], activeId: newConv.id }
    })

    setThinking(true)
    apiRequest<{ reply?: string }>("/api/assistant/chat", {
      method: "POST",
      body: { prompt: clean, messages: history },
    })
      .then((data) => {
        const reply = data?.reply ?? "Sorry, I couldn't respond right now."
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === thinkId ? { ...m, content: reply } : m,
            ),
          })),
        }))
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === thinkId ? { ...m, content: "Sorry, I couldn't respond right now." } : m,
            ),
          })),
        }))
      })
      .finally(() => setThinking(false))
  }

  React.useEffect(() => {
    // Also listen while already on /assistant — a router push to the same
    // route doesn't remount, so the mount-time consumer alone misses it.
    const off = onAction((id) => {
      if (id === "ask-ai") handleNewChat()
    })
    if (consumePendingAction("ask-ai")) handleNewChat()
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <DashboardShell activeHref="/assistant" current="AI Assistant" accentCurrent>
        <StoreErrorState onRetry={retry} />
      </DashboardShell>
    )
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/assistant" current="AI Assistant" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-[400px] w-[240px] rounded-lg" />
          <Skeleton className="h-[400px] flex-1 rounded-lg" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/assistant" current="AI Assistant" accentCurrent>
      <AssistantHeader />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <ChatHistoryPanel
          conversations={state.conversations}
          activeId={state.activeId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
        />
        <ChatConversation
          messages={activeConversation?.messages}
          suggestedPrompts={suggestedPrompts}
          thinking={thinking}
          onSendMessage={handleSendMessage}
          onSelectPrompt={(prompt) => {
            handleSendMessage(prompt)
          }}
        />
      </div>
    </DashboardShell>
  )
}
