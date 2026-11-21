import { randomUUID } from "crypto";
import type { DocumentChunk, OCRPage } from "../ocr/types";
import { getAIEnv } from "../ai/env";

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  respectPageBoundaries: boolean;
}

export function getDefaultChunkingOptions(): ChunkingOptions {
  const env = getAIEnv();
  return {
    chunkSize: env.RAG_CHUNK_SIZE,
    chunkOverlap: env.RAG_CHUNK_OVERLAP,
    respectPageBoundaries: true,
  };
}

export function chunkPages(
  pages: OCRPage[],
  documentId: string,
  fileName: string,
  mimeType: string,
  options?: Partial<ChunkingOptions>
): DocumentChunk[] {
  const opts = { ...getDefaultChunkingOptions(), ...options };
  const chunks: DocumentChunk[] = [];

  for (const page of pages) {
    const text = page.fullText;
    if (!text.trim()) continue;

    const sentences = splitIntoSentences(text);
    let currentChunk = "";
    let blockIndex = 0;
    let startIdx = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > opts.chunkSize && currentChunk.length > 0) {
        const chunk = createChunk(
          currentChunk.trim(),
          documentId,
          page.pageNumber,
          blockIndex++,
          startIdx,
          startIdx + currentChunk.length,
          fileName,
          mimeType,
          page.averageConfidence
        );
        chunks.push(chunk);

        const overlapText = currentChunk.slice(-opts.chunkOverlap);
        startIdx += currentChunk.length - overlapText.length;
        currentChunk = overlapText + sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(
        createChunk(
          currentChunk.trim(),
          documentId,
          page.pageNumber,
          blockIndex,
          startIdx,
          startIdx + currentChunk.length,
          fileName,
          mimeType,
          page.averageConfidence
        )
      );
    }
  }

  return chunks;
}

function createChunk(
  text: string,
  documentId: string,
  pageNumber: number,
  blockIndex: number,
  startIndex: number,
  endIndex: number,
  source: string,
  mimeType: string,
  confidence: number
): DocumentChunk {
  return {
    id: randomUUID(),
    documentId,
    pageNumber,
    blockIndex,
    text,
    metadata: {
      documentId,
      pageNumber,
      blockType: "text",
      confidence,
      startIndex,
      endIndex,
      source,
      mimeType,
      createdAt: new Date(),
    },
  };
}

function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  const regex = /[^.!?]+[.!?]+\s*/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    sentences.push(match[0]);
  }
  const remaining = text.slice(sentences.join("").length).trim();
  if (remaining) sentences.push(remaining);
  return sentences.length > 0 ? sentences : [text];
}
