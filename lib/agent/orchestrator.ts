import type { AIMessage, AIToolCall } from "../ai/types";
import type { UserContext } from "../context/engine";
import { getAIService } from "../ai/service";
import { getContextEngine } from "../context/engine";
import { getToolRegistry, TOOL_UNAVAILABLE_ERROR } from "./tools";
import { getToolSecurity } from "./security";
import { getRetriever, type RAGContext } from "../rag/retriever";
import { randomUUID } from "crypto";
import { getAIEnv } from "../ai/env";

export interface AgentRequest {
  message: string;
  user: UserContext;
  history?: AIMessage[];
  documentContext?: string;
  pageContext?: string;
  maxSteps?: number;
  requestId?: string;
}

export interface AgentStep {
  stepNumber: number;
  type: "think" | "tool_call" | "tool_result" | "retrieval" | "response" | "error";
  content?: string;
  toolCall?: AIToolCall;
  toolResult?: string;
  timestamp: Date;
  durationMs?: number;
}

export interface AgentResponse {
  response: string;
  steps: AgentStep[];
  toolCalls: { name: string; args: Record<string, unknown>; result: string }[];
  usage: { promptTokens: number; completionTokens: number; estimatedCost: number };
  requiresApproval: boolean;
  pendingApprovals: { toolName: string; args: Record<string, unknown>; description: string }[];
  requestId: string;
  durationMs: number;
}

export class AgentOrchestrator {
  private ai = getAIService();
  private contextEngine = getContextEngine();
  private security = getToolSecurity();
  private env = getAIEnv();

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    const requestId = request.requestId || randomUUID();
    const maxSteps = request.maxSteps || this.env.AI_MAX_STEPS;
    const steps: AgentStep[] = [];
    const toolCallResults: { name: string; args: Record<string, unknown>; result: string }[] = [];
    const pendingApprovals: { toolName: string; args: Record<string, unknown>; description: string }[] = [];

    const tools = getToolRegistry().getDefinitionsForRole(request.user.role);
    const context = await this.contextEngine.buildContext(
      request.user,
      request.pageContext ? { page: request.pageContext } : undefined,
      undefined,
      request.documentContext
    );

    let ragContext: RAGContext | undefined;
    // The document corpus can contain confidential HR letters. `/api/documents/search`
    // is admin-only for exactly this reason; the agent must not be a bypass
    // around that rule. Do not retrieve for managers/employees.
    if (request.user.role === "admin") {
      try {
        const retrieval = await getRetriever().retrieve(request.message);
        if (retrieval.totalChunks > 0) {
          ragContext = getRetriever().buildContext(retrieval);
          context.documentContext = ragContext.contextText;
        }
      } catch {}
    }

    const messages = this.contextEngine.buildMessages(context, request.message, request.history);
    const totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 };
    const MAX_TOTAL_TOKENS = 40000;
    const approvalStepCounts = new Map<string, number>();

    for (let step = 0; step < maxSteps; step++) {
      const stepStart = Date.now();

      // Enforce token budget (prompt + completion)
      if (totalUsage.totalTokens >= MAX_TOTAL_TOKENS) {
        steps.push({
          stepNumber: step + 1,
          type: "error",
          content: "Token budget exceeded",
          timestamp: new Date(),
        });
        break;
      }

      const response = await this.ai.generate(messages, {
        tools: tools.length > 0 ? tools : undefined,
        userId: request.user.userId,
        requestId,
      });

      totalUsage.promptTokens += response.usage.promptTokens;
      totalUsage.completionTokens += response.usage.completionTokens;
      totalUsage.totalTokens += response.usage.promptTokens + response.usage.completionTokens;
      totalUsage.estimatedCost += response.usage.estimatedCost;

      if (!response.toolCalls || response.toolCalls.length === 0) {
        steps.push({
          stepNumber: step + 1,
          type: "response",
          content: response.content,
          timestamp: new Date(),
          durationMs: Date.now() - stepStart,
        });

        return {
          response: response.content,
          steps,
          toolCalls: toolCallResults,
          usage: totalUsage,
          requiresApproval: false,
          pendingApprovals,
          requestId,
          durationMs: Date.now() - startTime,
        };
      }

      for (const toolCall of response.toolCalls) {
        const validation = this.security.validateToolCall(toolCall, tools, request.user);
        if (!validation.valid) {
          steps.push({
            stepNumber: step + 1,
            type: "error",
            content: validation.error,
            timestamp: new Date(),
          });
          messages.push({
            role: "tool",
            content: JSON.stringify({ error: validation.error }),
            toolCallId: toolCall.id,
          });
          continue;
        }

        const toolMeta = getToolRegistry().get(toolCall.name);
        if (!toolMeta) continue;

        // Unavailable write actions must never be advertised as mutable or
        // queued for approval. Return the same honest refusal the executor
        // would, and let the model tell the user to use the module UI.
        if (!toolMeta.available) {
          steps.push({
            stepNumber: step + 1,
            type: "error",
            content: TOOL_UNAVAILABLE_ERROR,
            timestamp: new Date(),
          });
          messages.push({
            role: "tool",
            content: JSON.stringify({ ok: false, error: TOOL_UNAVAILABLE_ERROR }),
            toolCallId: toolCall.id,
          });
          continue;
        }

        if (this.security.shouldRequireApproval(validation.tool!)) {
          const args = JSON.parse(toolCall.arguments);
          const approvalKey = `${toolCall.name}:${JSON.stringify(args)}`;
          const prevCount = approvalStepCounts.get(approvalKey) || 0;
          approvalStepCounts.set(approvalKey, prevCount + 1);

          // If the same approval has been requested 2+ times, stop looping
          if (prevCount >= 1) {
            steps.push({
              stepNumber: step + 1,
              type: "error",
              content: `Approval already pending for ${toolCall.name}. Stopping to avoid loop.`,
              timestamp: new Date(),
            });
            return {
              response: `This action requires your approval: ${toolCall.name}. Please use the /api/agent/approve endpoint to approve or reject it.`,
              steps,
              toolCalls: toolCallResults,
              usage: totalUsage,
              requiresApproval: true,
              pendingApprovals,
              requestId,
              durationMs: Date.now() - startTime,
            };
          }

          pendingApprovals.push({
            toolName: toolCall.name,
            args,
            description: `Execute ${toolCall.name}: ${JSON.stringify(args).substring(0, 200)}`,
          });

          steps.push({
            stepNumber: step + 1,
            type: "tool_call",
            content: `Pending approval: ${toolCall.name}`,
            toolCall,
            timestamp: new Date(),
            durationMs: Date.now() - stepStart,
          });

          messages.push({
            role: "tool",
            content: JSON.stringify({
              status: "pending_approval",
              message: "This action requires user approval before execution.",
            }),
            toolCallId: toolCall.id,
          });
          continue;
        }

        steps.push({
          stepNumber: step + 1,
          type: "tool_call",
          content: `Using tool: ${toolCall.name}`,
          toolCall,
          timestamp: new Date(),
        });

        try {
          const args = JSON.parse(toolCall.arguments);
          const sanitized = this.security.sanitizeArgs(args);
          const result = await toolMeta.executor(sanitized, request.user);

          toolCallResults.push({
            name: toolCall.name,
            args: sanitized,
            result,
          });

          steps.push({
            stepNumber: step + 1,
            type: "tool_result",
            content: result.substring(0, 500),
            toolResult: result,
            timestamp: new Date(),
          });

          messages.push({
            role: "tool",
            content: result,
            toolCallId: toolCall.id,
          });
        } catch (e) {
          const errorResult = JSON.stringify({ error: (e as Error).message });
          steps.push({
            stepNumber: step + 1,
            type: "error",
            content: (e as Error).message,
            timestamp: new Date(),
          });
          messages.push({
            role: "tool",
            content: errorResult,
            toolCallId: toolCall.id,
          });
        }
      }
    }

    const finalResponse = await this.ai.generate(messages, { userId: request.user.userId, requestId });
    return {
      response: finalResponse.content,
      steps,
      toolCalls: toolCallResults,
      usage: totalUsage,
      requiresApproval: pendingApprovals.length > 0,
      pendingApprovals,
      requestId,
      durationMs: Date.now() - startTime,
    };
  }
}

let _orchestrator: AgentOrchestrator | null = null;

export function getAgentOrchestrator(): AgentOrchestrator {
  if (!_orchestrator) _orchestrator = new AgentOrchestrator();
  return _orchestrator;
}
