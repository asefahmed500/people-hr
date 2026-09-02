import type { AIMessage } from "../ai/types";

export interface UserContext {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  department: string;
  managerId?: string;
}

export interface PageContext {
  page: string;
  entity?: string;
  entityId?: string;
  action?: string;
}

export interface WorkflowContext {
  currentWorkflow?: string;
  step?: string;
  history?: string[];
}

export interface SystemContext {
  timestamp: Date;
  organizationSize: number;
  activeModules: string[];
}

export interface FullContext {
  user: UserContext;
  page?: PageContext;
  workflow?: WorkflowContext;
  system: SystemContext;
  relevantData?: Record<string, unknown>;
  documentContext?: string;
}

export class ContextEngine {
  async buildContext(
    user: UserContext,
    page?: PageContext,
    workflow?: WorkflowContext,
    documentContext?: string
  ): Promise<FullContext> {
    const system: SystemContext = {
      timestamp: new Date(),
      organizationSize: 0,
      activeModules: [],
    };

    return {
      user,
      page,
      workflow,
      system,
      documentContext,
    };
  }

  buildSystemPrompt(context: FullContext): string {
    const roleDesc =
      context.user.role === "admin"
        ? "You are an AI assistant for an HR administrator. You have full access to all HR data and can perform all operations."
        : context.user.role === "manager"
          ? "You are an AI assistant for an HR manager. You can view and manage your department's data."
          : "You are an AI assistant for an employee. You can view your own data and submit requests.";

    let prompt = `${roleDesc}

User: ${context.user.name} (${context.user.role})
Department: ${context.user.department}
Current time: ${context.system.timestamp.toISOString()}`;

    if (context.page) {
      prompt += `\nCurrent page: ${context.page.page}`;
      if (context.page.entity) prompt += ` (viewing ${context.page.entity})`;
    }

    if (context.documentContext) {
      prompt += `\n\nRelevant document context:\n${context.documentContext}`;
    }

    prompt += `\n\nYou must answer based on the provided context. If you don't have enough information, say so clearly. Never fabricate data.`;

    return prompt;
  }

  buildMessages(context: FullContext, userMessage: string, history?: AIMessage[]): AIMessage[] {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages: AIMessage[] = [{ role: "system", content: systemPrompt }];

    if (history) messages.push(...history);
    messages.push({ role: "user", content: userMessage });

    return messages;
  }
}

let _engine: ContextEngine | null = null;

export function getContextEngine(): ContextEngine {
  if (!_engine) _engine = new ContextEngine();
  return _engine;
}
