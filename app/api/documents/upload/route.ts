import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { getDocumentProcessor } from "@/lib/documents/processor";
import { chunkPages } from "@/lib/rag/chunker";
import { getVectorStore } from "@/lib/rag/vector-store";
import { getEmbeddingService, EmbeddingUnavailableError } from "@/lib/rag/embeddings";
import { getAIEnv } from "@/lib/ai/env";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function isEmbeddingUnavailable(e: unknown): e is EmbeddingUnavailableError {
  return (
    e instanceof EmbeddingUnavailableError ||
    (typeof e === "object" && e !== null && (e as { code?: string }).code === "EMBEDDING_UNAVAILABLE")
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  // Fail early on oversized uploads: the proxy clones the body, and a
  // truncated form would otherwise be reported as a misleading 400.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 });
  }

  try {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Send a multipart form with a file." },
        { status: 400 },
      );
    }
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 });
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/tiff",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }

    // Indexing is part of this endpoint's contract. Fail fast and honestly when
    // embeddings are unavailable instead of accepting a document that could
    // never be found by search.
    if (!getEmbeddingService().isConfigured()) {
      return NextResponse.json(
        { error: "Document search is unavailable: embeddings are not configured." },
        { status: 503 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const processor = getDocumentProcessor();
    const result = await processor.processUpload(buffer, file.name, {
      userId: auth.session.user.id!,
      preprocess: true,
      extractFields: true,
      classifyType: true,
      chunkForRAG: true,
    });

    if (result.ocrResult && result.pageCount > 0) {
      const chunks = chunkPages(
        result.ocrResult.pages,
        result.id,
        file.name,
        file.type,
        { chunkSize: getAIEnv().RAG_CHUNK_SIZE, chunkOverlap: getAIEnv().RAG_CHUNK_OVERLAP }
      );
      result.chunks = chunks;
      await getVectorStore().addChunks(chunks, {
        id: result.id,
        name: file.name,
        uploadedBy: auth.session.user.id!,
        createdAt: result.createdAt.toISOString(),
      });
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      type: result.type,
      fileName: result.fileName,
      fileSize: result.fileSize,
      pageCount: result.pageCount,
      averageConfidence: result.ocrResult?.averageConfidence,
      needsReview: result.ocrResult?.needsReview ?? false,
      warning: result.ocrResult?.warning ?? null,
      fields: result.extracted?.fields,
      processingTimeMs: result.processingTimeMs,
      chunkCount: result.chunks?.length || 0,
    });
  } catch (e) {
    if (isEmbeddingUnavailable(e)) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    console.error("Document upload failed:", e);
    return NextResponse.json(
      { error: "Document processing failed" },
      { status: 500 }
    );
  }
}
