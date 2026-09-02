import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { getDocumentProcessor } from "@/lib/documents/processor";
import { chunkPages } from "@/lib/rag/chunker";
import { getVectorStore } from "@/lib/rag/vector-store";
import { getAIEnv } from "@/lib/ai/env";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
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
      try {
        const chunks = chunkPages(
          result.ocrResult.pages,
          result.id,
          file.name,
          file.type,
          { chunkSize: getAIEnv().RAG_CHUNK_SIZE, chunkOverlap: getAIEnv().RAG_CHUNK_OVERLAP }
        );
        result.chunks = chunks;
        const vectorStore = getVectorStore();
        await vectorStore.addChunks(chunks);
      } catch {}
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      type: result.type,
      fileName: result.fileName,
      fileSize: result.fileSize,
      pageCount: result.pageCount,
      averageConfidence: result.ocrResult?.averageConfidence,
      fields: result.extracted?.fields,
      processingTimeMs: result.processingTimeMs,
      chunkCount: result.chunks?.length || 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Processing failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
