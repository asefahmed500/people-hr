import OpenAI from "openai";
import {
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIStreamChunk,
  type AIUsage,
  type AIToolCall,
  type AIToolDefinition,
} from "./types";
import { getLLMConfig } from "./env";

function buildTools(tools?: AIToolDefinition[]) {
  if (!tools?.length) return undefined;
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

function mapFinishReason(reason: string | null): string {
  if (!reason) return "stop";
  return reason;
}

export class OpenAICompatibleProvider implements AIProvider {
  name = "openai-compatible";
  private client: OpenAI | null = null;
  private config: ReturnType<typeof getLLMConfig>;

  constructor(config?: { apiKey?: string; baseURL?: string }) {
    const llm = getLLMConfig();
    this.config = {
      apiKey: config?.apiKey || llm.apiKey,
      baseURL: config?.baseURL || llm.baseURL,
      model: llm.model,
    };
  }

  private getClient(): OpenAI {
    if (this.client) return this.client;
    if (!this.config.apiKey) {
      throw new Error("No LLM API key configured. Set LLM_API_KEY or ZAI_API_KEY.");
    }
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: 60000,
    });
    return this.client;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.models.list();
      return true;
    } catch {
      return !!this.config.apiKey;
    }
  }

  async generate(req: AIRequest): Promise<AIResponse> {
    const client = this.getClient();
    const model = req.model || this.config.model;
    const requestId = req.requestId || crypto.randomUUID();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = req.messages.map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg: any = {
        role: m.role,
        content: m.content,
      };
      if (m.toolCallId) msg.tool_call_id = m.toolCallId;
      if (m.toolCalls?.length) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.arguments },
        }));
      }
      return msg;
    });

    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: req.maxTokens || 2000,
      temperature: req.temperature ?? 0.7,
      tools: buildTools(req.tools),
      tool_choice: req.toolChoice || "auto",
      ...(req.responseFormat ? { response_format: req.responseFormat } : {}),
    });

    const choice = response.choices[0];
    const usage: AIUsage = {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      estimatedCost: 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCalls: AIToolCall[] | undefined = choice.message.tool_calls?.map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: tc.function.arguments,
    }));

    return {
      content: choice.message.content || "",
      toolCalls,
      usage,
      model: response.model,
      finishReason: mapFinishReason(choice.finish_reason),
      requestId,
    };
  }

  async *stream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
    const client = this.getClient();
    const model = req.model || this.config.model;
    const requestId = req.requestId || crypto.randomUUID();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = req.messages.map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg: any = {
        role: m.role,
        content: m.content,
      };
      if (m.toolCallId) msg.tool_call_id = m.toolCallId;
      return msg;
    });

    const stream = await client.chat.completions.create({
      model,
      messages,
      max_tokens: req.maxTokens || 2000,
      temperature: req.temperature ?? 0.7,
      tools: buildTools(req.tools),
      tool_choice: req.toolChoice || "auto",
      stream: true,
      stream_options: { include_usage: true },
    });

    const toolCallBuffers: Map<number, { id: string; name: string; arguments: string }> =
      new Map();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      const delta = choice?.delta;

      if (delta?.content) {
        yield { type: "text", content: delta.content };
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCallBuffers.has(idx)) {
            toolCallBuffers.set(idx, {
              id: tc.id || `call_${idx}`,
              name: tc.function?.name || "",
              arguments: "",
            });
          }
          const buf = toolCallBuffers.get(idx)!;
          if (tc.id) buf.id = tc.id;
          if (tc.function?.name) buf.name = tc.function.name;
          if (tc.function?.arguments) buf.arguments += tc.function.arguments;
        }
      }

      if (chunk.usage) {
        const usage: AIUsage = {
          promptTokens: chunk.usage.prompt_tokens || 0,
          completionTokens: chunk.usage.completion_tokens || 0,
          totalTokens: chunk.usage.total_tokens || 0,
          estimatedCost: 0,
        };
        yield { type: "done", usage };
      }

      if (choice?.finish_reason) {
        for (const [, buf] of toolCallBuffers) {
          yield {
            type: "tool_call",
            toolCall: { id: buf.id, name: buf.name, arguments: buf.arguments },
          };
        }
        toolCallBuffers.clear();
      }
    }
  }
}

let _provider: OpenAICompatibleProvider | null = null;

export function getProvider(): OpenAICompatibleProvider {
  if (!_provider) _provider = new OpenAICompatibleProvider();
  return _provider;
}
