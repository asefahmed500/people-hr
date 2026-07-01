import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AssistantHeader } from "@/components/assistant/assistant-header"
import { ChatHistoryPanel } from "@/components/assistant/chat-history-panel"
import { ChatConversation } from "@/components/assistant/chat-conversation"

export default function AssistantPage() {
  return (
    <DashboardShell activeHref="/assistant" current="AI Assistant" accentCurrent>
      <AssistantHeader />
      <div className="flex items-start gap-5">
        <ChatHistoryPanel />
        <ChatConversation />
      </div>
    </DashboardShell>
  )
}
