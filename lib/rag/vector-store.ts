import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { DocumentChunk } from "../ocr/types";
import { getEmbeddingService, EmbeddingUnavailableError } from "./embeddings";

// Feature data lives in ModuleState JSON documents. RAG chunks use a reserved
// scope so they never collide with user/workspace module documents; each row's
// key is a document id and its data holds that document's chunks + metadata.
const RAG_SCOPE_ID = "__rag__";
const MAX_WRITE_RETRIES = 3;

export interface RAGDocumentMeta {
  id: string;
  name: string;
  uploadedBy: string;
  createdAt: string;
}

export interface StoredChunk extends DocumentChunk {
  embedding?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

interface PersistedDocument {
  metadata: RAGDocumentMeta;
  chunks: StoredChunk[];
}

/** JSON-safe copy (Prisma Json can't hold Date instances). */
function serializeDocument(doc: PersistedDocument): Prisma.InputJsonValue {
  return {
    metadata: { ...doc.metadata },
    chunks: doc.chunks.map((chunk) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      pageNumber: chunk.pageNumber,
      blockIndex: chunk.blockIndex,
      text: chunk.text,
      embedding: chunk.embedding,
      metadata: {
        ...chunk.metadata,
        createdAt: new Date(chunk.metadata.createdAt).toISOString(),
      },
    })),
  } as unknown as Prisma.InputJsonValue;
}

/** Rebuild a document from a stored row, reviving ISO dates and filling gaps. */
function parseDocument(
  data: Prisma.JsonValue,
  key: string,
  rowCreatedAt: Date,
): PersistedDocument | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const raw = data as unknown as Partial<PersistedDocument>;
  if (!Array.isArray(raw.chunks)) return null;

  const meta = raw.metadata as Partial<RAGDocumentMeta> | undefined;
  const metadata: RAGDocumentMeta = {
    id: meta?.id || key,
    name: meta?.name || key,
    uploadedBy: meta?.uploadedBy || "unknown",
    createdAt: meta?.createdAt || rowCreatedAt.toISOString(),
  };

  const chunks: StoredChunk[] = raw.chunks
    .filter((chunk): chunk is StoredChunk => !!chunk && typeof chunk.id === "string")
    .map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        createdAt: new Date(String(chunk.metadata.createdAt)),
      },
    }));

  return { metadata, chunks };
}

export class VectorStore {
  private chunks: Map<string, StoredChunk> = new Map();
  private documents: Map<string, RAGDocumentMeta> = new Map();
  private embeddings = getEmbeddingService();
  private loadPromise: Promise<void> | null = null;

  /**
   * Load all RAG rows on demand. Concurrent first callers share one read; the
   * promise is cleared afterwards so the next search sees writes from other
   * instances (multi-instance deploys don't share this process's memory).
   */
  private refresh(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.loadFromDb().finally(() => {
        this.loadPromise = null;
      });
    }
    return this.loadPromise;
  }

  private async loadFromDb(): Promise<void> {
    const rows = await prisma.moduleState.findMany({
      where: { userId: RAG_SCOPE_ID },
    });

    const chunks = new Map<string, StoredChunk>();
    const documents = new Map<string, RAGDocumentMeta>();
    for (const row of rows) {
      const doc = parseDocument(row.data, row.key, row.createdAt);
      if (!doc) continue;
      documents.set(row.key, doc.metadata);
      for (const chunk of doc.chunks) {
        chunks.set(chunk.id, chunk);
      }
    }
    this.chunks = chunks;
    this.documents = documents;
  }

  /**
   * Embed and persist a document's chunks. `metadata` carries the document
   * details needed for future access control; callers should pass `uploadedBy`.
   */
  async addChunks(
    chunks: DocumentChunk[],
    metadata: Partial<RAGDocumentMeta> = {},
  ): Promise<void> {
    if (chunks.length === 0) return;

    const texts = chunks.map((c) => c.text);
    const embeddingResults = await this.embeddings.embedBatch(texts);

    // Defensive guard: embedBatch throws on failure, but never trust that an
    // upstream response lines up with the input chunks.
    if (embeddingResults.length !== chunks.length) {
      throw new EmbeddingUnavailableError(
        `Document search is unavailable: the embedding service returned ${embeddingResults.length} vectors for ${chunks.length} chunks.`,
      );
    }

    const stored: StoredChunk[] = chunks.map((chunk, i) => {
      const vector = embeddingResults[i]?.vector;
      if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new EmbeddingUnavailableError(
          `Document search is unavailable: no embedding was returned for chunk ${chunk.id}.`,
        );
      }
      return { ...chunk, embedding: vector };
    });

    const documentId = metadata.id || stored[0].documentId;
    const docMeta: RAGDocumentMeta = {
      id: documentId,
      name: metadata.name || stored[0].metadata.source || documentId,
      uploadedBy: metadata.uploadedBy || "unknown",
      createdAt: metadata.createdAt || new Date().toISOString(),
    };

    await this.upsertDocument(
      documentId,
      serializeDocument({ metadata: docMeta, chunks: stored }),
      () => {
        // Keep this process's in-memory view in sync after a successful write.
        for (const chunk of stored) this.chunks.set(chunk.id, chunk);
        this.documents.set(documentId, docMeta);
      },
    );
  }

  /**
   * Read-modify-write with a CAS on `updatedAt`. A previous row is replaced with
   * a new version only if nobody wrote it between our read and our write; a
   * create race is retried. Losing all retries surfaces a clear conflict error.
   */
  private async upsertDocument(
    documentId: string,
    payload: Prisma.InputJsonValue,
    onWritten: () => void,
  ): Promise<void> {
    for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
      const existing = await prisma.moduleState.findUnique({
        where: { userId_key: { userId: RAG_SCOPE_ID, key: documentId } },
        select: { updatedAt: true },
      });

      if (!existing) {
        try {
          await prisma.moduleState.create({
            data: { userId: RAG_SCOPE_ID, key: documentId, data: payload },
          });
          onWritten();
          return;
        } catch {
          // Another writer created the row first — retry with a CAS update.
          continue;
        }
      }

      const swapped = await prisma.moduleState.updateMany({
        where: { userId: RAG_SCOPE_ID, key: documentId, updatedAt: existing.updatedAt },
        data: { data: payload },
      });
      if (swapped.count > 0) {
        onWritten();
        return;
      }
    }

    throw new Error(`Document index for ${documentId} changed concurrently; please retry.`);
  }

  removeDocument(documentId: string): void {
    for (const [id, chunk] of this.chunks) {
      if (chunk.documentId === documentId) this.chunks.delete(id);
    }
    this.documents.delete(documentId);
    // Best-effort removal from the shared store; in-memory state is already
    // correct locally and a search refresh will converge with other instances.
    void prisma.moduleState
      .deleteMany({ where: { userId: RAG_SCOPE_ID, key: documentId } })
      .catch((e: unknown) => console.error("Failed to remove document from index:", e));
  }

  async search(
    query: string,
    options: {
      topK?: number;
      documentIds?: string[];
      minScore?: number;
    } = {},
  ): Promise<SearchResult[]> {
    const { topK = 5, documentIds, minScore = 0.3 } = options;
    await this.refresh();

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

  getDocumentMetadata(documentId: string): RAGDocumentMeta | undefined {
    return this.documents.get(documentId);
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
