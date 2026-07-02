"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AssistantHeader } from "@/components/assistant/assistant-header"
import { ChatHistoryPanel } from "@/components/assistant/chat-history-panel"
import { ChatConversation } from "@/components/assistant/chat-conversation"
import { Skeleton } from "@/components/ui/skeleton"
import { useMockStore } from "@/hooks/use-mock-store"
import {
  STORAGE_KEYS,
  type AssistantStore,
  type Conversation,
  type ChatMessage,
  defaultAssistantStore,
  defaultNotificationsStore,
  newNotification,
  replyFor,
  suggestedPrompts,
  type NotificationsStore,
  type Notification,
} from "@/lib/data"

const uid = () => Math.random().toString(36).substring(2, 10)

export function AssistantPageClient() {
  const { state, setState, hydrated } = useMockStore<AssistantStore>(
    STORAGE_KEYS.assistant,
    () => defaultAssistantStore,
  )
  const { setState: setNotifs } = useMockStore<NotificationsStore>(
    STORAGE_KEYS.notifications,
    () => defaultNotificationsStore,
  )
  const addNotification = (n: Partial<Notification> & { title: string; description: string }) => {
    const notification = newNotification(n)
    setNotifs((prev) => ({ items: [notification, ...prev.items] }))
  }

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
    addNotification({ type: "settings_changed", title: "New conversation", description: "Started a new AI assistant conversation" })
  }

  function handleSelectConversation(id: string) {
    setState((prev) => ({ ...prev, activeId: id }))
  }

  function handleSendMessage(msg: string) {
    setState((prev) => {
      const userMsg: ChatMessage = { id: uid(), role: "user", content: msg, ts: Date.now() }
      const thinkMsg: ChatMessage = { id: uid(), role: "assistant", content: "Thinking...", ts: Date.now() + 300 }
      const targetId = prev.activeId
      if (targetId) {
        return {
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === targetId
              ? {
                  ...c,
                  title: c.messages.length === 0 ? msg.slice(0, 30) : c.title,
                  updatedAt: Date.now(),
                  messages: [...c.messages, userMsg, thinkMsg],
                }
              : c,
          ),
        }
      }
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: msg.slice(0, 30),
        updatedAt: Date.now(),
        messages: [userMsg, thinkMsg],
      }
      return {
        conversations: [newConv, ...prev.conversations],
        activeId: newConv.id,
      }
    })

    setTimeout(() => {
      setState((prev) => {
        const conv = prev.conversations.find((c) => c.id === (prev.activeId ?? prev.conversations[0]?.id))
        if (!conv) return prev
        const lastIdx = conv.messages.length - 1
        const last = conv.messages[lastIdx]
        if (last?.role === "assistant" && last.content === "Thinking...") {
          const updated = [...conv.messages]
          updated[lastIdx] = { ...last, content: replyFor(msg) }
          return {
            ...prev,
            conversations: prev.conversations.map((c) =>
              c.id === conv.id ? { ...c, messages: updated } : c,
            ),
          }
        }
        return prev
      })
    }, 1500)
  }

  function handleSelectPrompt(prompt: string) {
    handleSendMessage(prompt)
  }

  if (!hydrated) {
    return (
      <DashboardShell activeHref="/assistant" current="AI Assistant" accentCurrent>
        <Skeleton className="h-8 w-[200px] rounded-lg" />
        <div className="mt-4 flex gap-5">
          <Skeleton className="h-[400px] w-[240px] rounded-[14px]" />
          <Skeleton className="h-[400px] flex-1 rounded-[14px]" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeHref="/assistant" current="AI Assistant" accentCurrent>
      <AssistantHeader />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <ChatHistoryPanel
          conversations={state.conversations}
          activeId={state.activeId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />
        <ChatConversation
          messages={activeConversation?.messages}
          suggestedPrompts={suggestedPrompts}
          onSendMessage={handleSendMessage}
          onSelectPrompt={(prompt) => {
            handleSendMessage(prompt)
          }}
        />
      </div>
    </DashboardShell>
  )
}
