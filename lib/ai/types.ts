export type AIModelTier = "simple" | "general" | "reasoning" | "extraction" | "agent";

export interface AIModelConfig {
  id: string;
  name: string;
  tier: AIModelTier;
  maxTokens: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsStructured: boolean;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: AIToolCall[];
  name?: string;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface AIToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  tier?: AIModelTier;
  maxTokens?: number;
  temperature?: number;
  tools?: AIToolDefinition[];
  toolChoice?: "auto" | "none" | "required";
  responseFormat?: { type: "json_object" };
  stream?: boolean;
  requestId?: string;
  userId?: string;
  organizationId?: string;
}

export interface AIResponse {
  content: string;
  toolCalls?: AIToolCall[];
  usage: AIUsage;
  model: string;
  finishReason: string;
  requestId: string;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  riskLevel: "low" | "medium" | "high";
  requiresApproval: boolean;
  permission: string[];
  timeout: number;
  sideEffects: boolean;
  idempotent: boolean;
}

export interface AIStreamChunk {
  type: "text" | "tool_call" | "tool_result" | "done" | "error" | "status";
  content?: string;
  toolCall?: AIToolCall;
  toolResult?: AIToolResult;
  usage?: AIUsage;
  error?: string;
  status?: string;
}

export interface AITaskClassification {
  tier: AIModelTier;
  needsTools: boolean;
  needsStreaming: boolean;
  needsStructured: boolean;
  estimatedTokens: number;
  complexity: "low" | "medium" | "high";
}

export interface AIProvider {
  name: string;
  generate(req: AIRequest): Promise<AIResponse>;
  stream?(req: AIRequest): AsyncGenerator<AIStreamChunk>;
  isAvailable(): Promise<boolean>;
}
