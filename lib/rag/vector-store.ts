import type { DocumentChunk } from "../ocr/types";
import { getEmbeddingService, type EmbeddingResult } from "./embeddings";

export interface StoredChunk extends DocumentChunk {
  embedding?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export class VectorStore {
  private chunks: Map<string, StoredChunk> = new Map();
  private embeddings = getEmbeddingService();

  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    const texts = chunks.map((c) => c.text);
    const embeddingResults = await this.embeddings.embedBatch(texts);

    for (let i = 0; i < chunks.length; i++) {
      const stored: StoredChunk = {
        ...chunks[i],
        embedding: embeddingResults[i].vector,
      };
      this.chunks.set(chunks[i].id, stored);
    }
  }

  removeDocument(documentId: string): void {
    for (const [id, chunk] of this.chunks) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
      }
    }
  }

  async search(
    query: string,
    options: {
      topK?: number;
      documentIds?: string[];
      minScore?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, documentIds, minScore = 0.3 } = options;
    const queryEmbedding = await this.embeddings.embed(query);

    const candidates = Array.from(this.chunks.values()).filter((c) => {
      if (!c.embedding) return false;
      if (documentIds?.length && !documentIds.includes(c.documentId)) return false;
      return true;
    });

    const results: SearchResult[] = candidates.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding.vector, chunk.embedding!),
    }));

    results.sort((a, b) => b.score - a.score);
    return results.filter((r) => r.score >= minScore).slice(0, topK);
  }

  size(): number {
    return this.chunks.size;
  }

  getDocumentChunks(documentId: string): DocumentChunk[] {
    return Array.from(this.chunks.values()).filter((c) => c.documentId === documentId);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

let _store: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!_store) _store = new VectorStore();
  return _store;
}
