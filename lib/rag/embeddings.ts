import OpenAI from "openai";
import { getLLMConfig, getAIEnv } from "../ai/env";

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  model: string;
}

export class EmbeddingService {
  private client: OpenAI | null = null;
  private model: string;
  private dimensions: number;

  constructor() {
    const config = getLLMConfig();
    const env = getAIEnv();
    this.model = env.AI_EMBEDDING_MODEL;
    this.dimensions = env.AI_EMBEDDING_DIMENSIONS;
    if (config.apiKey) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
    }
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.client) {
      return this.fallbackEmbed(text);
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text.substring(0, 8000),
        dimensions: this.dimensions,
      });
      return {
        vector: response.data[0].embedding,
        dimensions: this.dimensions,
        model: this.model,
      };
    } catch {
      return this.fallbackEmbed(text);
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.client) {
      return Promise.all(texts.map((t) => this.fallbackEmbed(t)));
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts.map((t) => t.substring(0, 8000)),
        dimensions: this.dimensions,
      });
      return response.data.map((d) => ({
        vector: d.embedding,
        dimensions: this.dimensions,
        model: this.model,
      }));
    } catch {
      return Promise.all(texts.map((t) => this.fallbackEmbed(t)));
    }
  }

  private fallbackEmbed(text: string): EmbeddingResult {
    const hash = simpleHash(text);
    const vector = new Array(this.dimensions).fill(0);
    for (let i = 0; i < this.dimensions; i++) {
      vector[i] = Math.sin(hash * (i + 1) * 0.001) * 0.5 + 0.5;
    }
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    for (let i = 0; i < vector.length; i++) vector[i] /= norm || 1;
    return { vector, dimensions: this.dimensions, model: "fallback-hash" };
  }
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

let _embeddingService: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!_embeddingService) _embeddingService = new EmbeddingService();
  return _embeddingService;
}
