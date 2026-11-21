import OpenAI from "openai";
import { getAIEnv } from "../ai/env";

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  model: string;
}

/**
 * Raised when document search cannot run because embeddings are unavailable —
 * either no provider is configured or the embedding API call failed. API routes
 * map this to HTTP 503 instead of pretending retrieval succeeded.
 */
export class EmbeddingUnavailableError extends Error {
  readonly code = "EMBEDDING_UNAVAILABLE";

  constructor(message: string) {
    super(message);
    this.name = "EmbeddingUnavailableError";
    Object.setPrototypeOf(this, EmbeddingUnavailableError.prototype);
  }
}

type AIEnv = ReturnType<typeof getAIEnv>;

/**
 * Resolve a coherent (key, endpoint) pair for embeddings.
 *
 * `getLLMConfig()` currently picks the key with `LLM_API_KEY || ZAI…` but the
 * endpoint with "no ZAI alias present", so setting both sends an OpenAI key to
 * api.z.ai. This mirrors the working resolution in the assistant chat route and
 * never mixes providers. Returns null when no credentials are configured at all.
 */
function resolveEmbeddingConfig(env: AIEnv): { apiKey: string; baseURL: string } | null {
  const zaiKey = env.ZAI_API_KEY || env.ZHIPU_API_KEY || env.GLM_API_KEY || "";
  const apiKey = env.LLM_API_KEY || zaiKey;
  if (!apiKey) return null;

  const usingZaiAlias = !env.LLM_API_KEY && !!zaiKey;
  const baseURL =
    process.env.LLM_BASE_URL ||
    (usingZaiAlias ? "https://api.z.ai/api/paas/v4" : "https://api.openai.com/v1");
  return { apiKey, baseURL };
}

export class EmbeddingService {
  private client: OpenAI | null = null;
  private model: string;
  private dimensions: number;

  constructor() {
    const env = getAIEnv();
    this.model = env.AI_EMBEDDING_MODEL;
    this.dimensions = env.AI_EMBEDDING_DIMENSIONS;
    const config = resolveEmbeddingConfig(env);
    if (config) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
    }
  }

  /** True only when a real embedding provider is configured. */
  isConfigured(): boolean {
    return this.client !== null;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const client = this.requireClient();
    try {
      const response = await client.embeddings.create({
        model: this.model,
        input: text.substring(0, 8000),
        dimensions: this.dimensions,
      });
      return this.toResult(response.data?.[0]?.embedding);
    } catch (e) {
      throw this.apiError(e);
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];
    const client = this.requireClient();

    let data: Array<{ embedding?: number[] }>;
    try {
      const response = await client.embeddings.create({
        model: this.model,
        input: texts.map((t) => t.substring(0, 8000)),
        dimensions: this.dimensions,
      });
      data = response.data ?? [];
    } catch (e) {
      throw this.apiError(e);
    }

    // A provider must return exactly one vector per input. Never hand back a
    // short or padded array — callers would otherwise write undefined vectors.
    if (data.length !== texts.length) {
      throw new EmbeddingUnavailableError(
        `Document search is unavailable: the embedding service returned ${data.length} vectors for ${texts.length} inputs.`,
      );
    }
    return data.map((d) => this.toResult(d.embedding));
  }

  private requireClient(): OpenAI {
    if (!this.client) {
      throw new EmbeddingUnavailableError(
        "Document search is unavailable: embeddings are not configured. Set LLM_API_KEY (or a Z.AI alias) and an embedding model to enable document search.",
      );
    }
    return this.client;
  }

  private toResult(vector: number[] | undefined): EmbeddingResult {
    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      throw new EmbeddingUnavailableError(
        "Document search is unavailable: the embedding service returned an empty vector.",
      );
    }
    return { vector, dimensions: vector.length, model: this.model };
  }

  private apiError(e: unknown): EmbeddingUnavailableError {
    if (e instanceof EmbeddingUnavailableError) return e;
    const detail = e instanceof Error ? e.message : String(e);
    return new EmbeddingUnavailableError(
      `Document search is unavailable: the embedding service request failed. ${detail}`,
    );
  }
}

let _embeddingService: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!_embeddingService) _embeddingService = new EmbeddingService();
  return _embeddingService;
}
