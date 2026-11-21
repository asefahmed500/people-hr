import {
  type AIModelTier,
  type AITaskClassification,
  type AIRequest,
} from "./types";
import { getModelForTier } from "./env";

const TIER_CONFIG: Record<
  AIModelTier,
  {
    maxTokens: number;
    temperature: number;
    supportsTools: boolean;
    supportsStreaming: boolean;
  }
> = {
  simple: { maxTokens: 500, temperature: 0.3, supportsTools: false, supportsStreaming: true },
  general: { maxTokens: 2000, temperature: 0.7, supportsTools: true, supportsStreaming: true },
  reasoning: { maxTokens: 4000, temperature: 0.3, supportsTools: true, supportsStreaming: true },
  extraction: { maxTokens: 3000, temperature: 0.1, supportsTools: false, supportsStreaming: false },
  agent: { maxTokens: 4000, temperature: 0.3, supportsTools: true, supportsStreaming: true },
};

export function classifyTask(input: string, hasTools: boolean): AITaskClassification {
  const len = input.length;
  const lower = input.toLowerCase();

  if (
    len < 50 &&
    !lower.includes("analyze") &&
    !lower.includes("compare") &&
    !lower.includes("explain") &&
    !hasTools
  ) {
    return {
      tier: "simple",
      needsTools: false,
      needsStreaming: true,
      needsStructured: false,
      estimatedTokens: Math.ceil(len / 4),
      complexity: "low",
    };
  }

  const isDataQuestion =
    lower.includes("how many") ||
    lower.includes("what is the") ||
    lower.includes("show me") ||
    lower.includes("list") ||
    lower.includes("count");

  const isAnalysis =
    lower.includes("analyze") ||
    lower.includes("compare") ||
    lower.includes("why") ||
    lower.includes("explain") ||
    lower.includes("summarize");

  const isAction =
    lower.includes("create") ||
    lower.includes("update") ||
    lower.includes("delete") ||
    lower.includes("assign") ||
    lower.includes("approve") ||
    lower.includes("send");

  if (isAction && hasTools) {
    return {
      tier: "agent",
      needsTools: true,
      needsStreaming: true,
      needsStructured: false,
      estimatedTokens: Math.ceil(len / 4) + 500,
      complexity: "high",
    };
  }

  if (isAnalysis || isDataQuestion) {
    return {
      tier: "reasoning",
      needsTools: hasTools,
      needsStreaming: true,
      needsStructured: false,
      estimatedTokens: Math.ceil(len / 4) + 300,
      complexity: "medium",
    };
  }

  return {
    tier: "general",
    needsTools: hasTools,
    needsStreaming: true,
    needsStructured: false,
    estimatedTokens: Math.ceil(len / 4) + 200,
    complexity: "medium",
  };
}

export function resolveModel(tier: AIModelTier): string {
  return getModelForTier(tier);
}

export function resolveTierConfig(tier: AIModelTier) {
  return TIER_CONFIG[tier];
}

export function buildRequest(
  base: AIRequest,
  classification: AITaskClassification
): AIRequest {
  const config = resolveTierConfig(classification.tier);
  return {
    ...base,
    model: base.model || resolveModel(classification.tier),
    maxTokens: base.maxTokens || config.maxTokens,
    temperature: base.temperature ?? config.temperature,
    tools: classification.needsTools ? base.tools : undefined,
    stream: classification.needsStreaming,
  };
}

export function estimateCost(
  promptTokens: number,
  completionTokens: number,
  model: string
): number {
  const inputRate = model.includes("gpt-4") ? 0.01 : 0.0005;
  const outputRate = model.includes("gpt-4") ? 0.03 : 0.0015;
  return (promptTokens * inputRate + completionTokens * outputRate) / 1000;
}
