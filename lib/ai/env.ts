import { z } from "zod";
import type { AIModelTier } from "./types";

const aiEnvSchema = z.object({
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.string().default("https://api.openai.com/v1"),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  ZAI_API_KEY: z.string().optional(),
  ZHIPU_API_KEY: z.string().optional(),
  GLM_API_KEY: z.string().optional(),
  AI_TASK_SIMPLE: z.string().optional(),
  AI_TASK_GENERAL: z.string().optional(),
  AI_TASK_REASONING: z.string().optional(),
  AI_TASK_EXTRACTION: z.string().optional(),
  AI_TASK_AGENT: z.string().optional(),
  AI_MAX_STEPS: z.coerce.number().default(10),
  AI_MAX_TOOL_CALLS: z.coerce.number().default(20),
  AI_TIMEOUT_MS: z.coerce.number().default(60000),
  AI_TOOL_TIMEOUT_MS: z.coerce.number().default(30000),
  AI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  AI_EMBEDDING_DIMENSIONS: z.coerce.number().default(1536),
  OCR_PROVIDER: z.enum(["tesseract", "google", "aws", "azure"]).default("tesseract"),
  OCR_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.6),
  OCR_MAX_PAGES: z.coerce.number().default(50),
  RAG_CHUNK_SIZE: z.coerce.number().default(1000),
  RAG_CHUNK_OVERLAP: z.coerce.number().default(200),
  RAG_TOP_K: z.coerce.number().default(5),
  RAG_RERANK_TOP_K: z.coerce.number().default(3),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
});

type AIEnv = z.infer<typeof aiEnvSchema>;

let _env: AIEnv | null = null;

export function getAIEnv(): AIEnv {
  if (_env) return _env;
  _env = aiEnvSchema.parse(process.env);
  return _env;
}

export function getLLMConfig() {
  const env = getAIEnv();
  const apiKey = env.LLM_API_KEY || env.ZAI_API_KEY || env.ZHIPU_API_KEY || env.GLM_API_KEY || "";
  const baseURL =
    env.LLM_API_KEY && !env.ZAI_API_KEY && !env.ZHIPU_API_KEY && !env.GLM_API_KEY
      ? env.LLM_BASE_URL
      : "https://api.z.ai/api/paas/v4";
  const model = env.LLM_MODEL === "gpt-4o-mini" && !env.LLM_API_KEY ? "glm-5.3" : env.LLM_MODEL;
  return { apiKey, baseURL, model };
}

export function getModelForTier(tier: AIModelTier): string {
  const env = getAIEnv();
  const overrides: Record<AIModelTier, string | undefined> = {
    simple: env.AI_TASK_SIMPLE,
    general: env.AI_TASK_GENERAL,
    reasoning: env.AI_TASK_REASONING,
    extraction: env.AI_TASK_EXTRACTION,
    agent: env.AI_TASK_AGENT,
  };
  return overrides[tier] || getLLMConfig().model;
}

export type { AIModelTier };
