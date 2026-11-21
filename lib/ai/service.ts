import { z } from "zod";
import { randomUUID } from "crypto";
import {
  type AIRequest,
  type AIResponse,
  type AIStreamChunk,
  type AIMessage,
  type AIToolDefinition,
  type AIToolCall,
  type AIToolResult,
  type AIUsage,
  type AIModelTier,
} from "./types";
import { classifyTask, buildRequest, estimateCost } from "./router";
import { getProvider } from "./provider";
import { getAIEnv } from "./env";

export interface AIServiceOptions {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  onStatus?: (status: string) => void;
}

export class AIService {
  private env = getAIEnv();

  async generate(
    messages: AIMessage[],
    options: AIServiceOptions & {
      tools?: AIToolDefinition[];
      tier?: AIModelTier;
      maxTokens?: number;
      temperature?: number;
      responseFormat?: { type: "json_object" };
    } = {}
  ): Promise<AIResponse> {
    const requestId = options.requestId || randomUUID();
    const classification = classifyTask(
      messages.map((m) => m.content).join(" "),
      !!options.tools?.length
    );

    const tier = options.tier || classification.tier;
    const req: AIRequest = {
      messages,
      tier,
      tools: options.tools,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      responseFormat: options.responseFormat,
      requestId,
      userId: options.userId,
      organizationId: options.organizationId,
    };

    const built = buildRequest(req, {
      ...classification,
      tier,
      needsTools: !!options.tools?.length,
    });

    options.onStatus?.("Generating response...");
    const provider = getProvider();
    const response = await provider.generate(built);

    response.usage.estimatedCost = estimateCost(
      response.usage.promptTokens,
      response.usage.completionTokens,
      response.model
    );

    return response;
  }

  async *stream(
    messages: AIMessage[],
    options: AIServiceOptions & {
      tools?: AIToolDefinition[];
      tier?: AIModelTier;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<AIStreamChunk> {
    const requestId = options.requestId || randomUUID();
    const classification = classifyTask(
      messages.map((m) => m.content).join(" "),
      !!options.tools?.length
    );

    const tier = options.tier || classification.tier;
    const req: AIRequest = {
      messages,
      tier,
      tools: options.tools,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      requestId,
      userId: options.userId,
      organizationId: options.organizationId,
    };

    const built = buildRequest(req, {
      ...classification,
      tier,
      needsTools: !!options.tools?.length,
    });

    options.onStatus?.("Thinking...");
    const provider = getProvider();
    yield* provider.stream!(built);
  }

  async structuredGenerate<T>(
    messages: AIMessage[],
    schema: z.ZodSchema<T>,
    options: AIServiceOptions = {}
  ): Promise<{ data: T; usage: AIUsage }> {
    const jsonMessages: AIMessage[] = [
      ...messages,
      {
        role: "user",
        content: "Respond with valid JSON only. No markdown, no explanation, just the JSON object.",
      },
    ];

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await this.generate(jsonMessages, {
        ...options,
        tier: "extraction",
        temperature: 0.1,
        responseFormat: { type: "json_object" },
      });

      try {
        const parsed = JSON.parse(response.content);
        const validated = schema.parse(parsed);
        return { data: validated, usage: response.usage };
      } catch (e) {
        lastError = e as Error;
        continue;
      }
    }

    throw new Error(
      `Structured generation failed after 3 attempts: ${lastError?.message}`
    );
  }

  async executeTool(
    toolCall: AIToolCall,
    tools: AIToolDefinition[],
    executor: (name: string, args: Record<string, unknown>) => Promise<string>
  ): Promise<AIToolResult> {
    const tool = tools.find((t) => t.name === toolCall.name);
    if (!tool) {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({ error: `Unknown tool: ${toolCall.name}` }),
        isError: true,
      };
    }

    try {
      const args = JSON.parse(toolCall.arguments);
      const result = await Promise.race([
        executor(toolCall.name, args),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Tool ${toolCall.name} timed out`)),
            this.env.AI_TOOL_TIMEOUT_MS
          )
        ),
      ]);

      return { toolCallId: toolCall.id, content: result };
    } catch (e) {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({ error: (e as Error).message }),
        isError: true,
      };
    }
  }
}

let _service: AIService | null = null;

export function getAIService(): AIService {
  if (!_service) _service = new AIService();
  return _service;
}
