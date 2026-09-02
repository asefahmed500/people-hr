import type { DocumentChunk } from "../ocr/types";
import { getVectorStore, type SearchResult } from "./vector-store";
import { getAIEnv } from "../ai/env";

export interface RetrievalResult {
  chunks: SearchResult[];
  query: string;
  totalChunks: number;
  processingTimeMs: number;
}

export interface RAGContext {
  relevantChunks: DocumentChunk[];
  contextText: string;
  sources: { documentId: string; pageNumber: number; source: string }[];
}

export class Retriever {
  private store = getVectorStore();

  async retrieve(
    query: string,
    options: {
      topK?: number;
      documentIds?: string[];
      rerank?: boolean;
    } = {}
  ): Promise<RetrievalResult> {
    const env = getAIEnv();
    const startTime = Date.now();
    const topK = options.topK || env.RAG_TOP_K;

    const results = await this.store.search(query, {
      topK: topK * 2,
      documentIds: options.documentIds,
      minScore: 0.2,
    });

    const reranked = options.rerank !== false
      ? this.rerank(query, results).slice(0, env.RAG_RERANK_TOP_K)
      : results.slice(0, topK);

    return {
      chunks: reranked,
      query,
      totalChunks: reranked.length,
      processingTimeMs: Date.now() - startTime,
    };
  }

  buildContext(results: RetrievalResult): RAGContext {
    const chunks = results.chunks.map((r) => r.chunk);
    const sources = chunks.map((c) => ({
      documentId: c.documentId,
      pageNumber: c.pageNumber,
      source: c.metadata.source,
    }));

    const contextText = chunks
      .map(
        (c, i) =>
          `[Source ${i + 1}: ${c.metadata.source}, Page ${c.pageNumber}]\n${c.text}`
      )
      .join("\n\n---\n\n");

    return {
      relevantChunks: chunks,
      contextText,
      sources,
    };
  }

  private rerank(query: string, results: SearchResult[]): SearchResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    return results
      .map((r) => {
        const textLower = r.chunk.text.toLowerCase();
        let termBoost = 0;
        for (const term of queryTerms) {
          if (textLower.includes(term)) termBoost += 0.05;
        }
        return { ...r, score: r.score + termBoost };
      })
      .sort((a, b) => b.score - a.score);
  }
}

let _retriever: Retriever | null = null;

export function getRetriever(): Retriever {
  if (!_retriever) _retriever = new Retriever();
  return _retriever;
}
