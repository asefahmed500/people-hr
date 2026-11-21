/**
 * All confidence values in this module are on a single 0-1 scale, where 1 means
 * "certain". Values returned by Tesseract (0-100) are converted before they are
 * stored on any of the types below.
 */

/** The only OCR engine actually implemented in this codebase. */
export type OCRProviderName = "tesseract";

export interface OCRConfig {
  provider: OCRProviderName;
  language: string;
  confidenceThreshold: number;
  maxPages: number;
  preprocess: boolean;
}

export interface OCRBoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: OCRBoundingBox;
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: OCRBoundingBox;
  words: OCRWord[];
}

export interface OCRBlock {
  text: string;
  confidence: number;
  bbox: OCRBoundingBox;
  type: "text" | "heading" | "table" | "image" | "separator";
  lines: OCRLine[];
}

export interface OCRTable {
  rows: string[][];
  bbox: OCRBoundingBox;
  confidence: number;
}

export interface OCRPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: OCRBlock[];
  tables: OCRTable[];
  fullText: string;
  averageConfidence: number;
  processingTimeMs: number;
}

export interface OCRResult {
  pages: OCRPage[];
  fullText: string;
  averageConfidence: number;
  totalPages: number;
  processingTimeMs: number;
  provider: OCRProviderName;
  language: string;
  needsReview: boolean;
  /** Set when extraction was incomplete or unavailable (e.g. a scanned PDF). */
  warning?: string;
}

export interface OCRField {
  name: string;
  value: string;
  confidence: number;
  source: "ocr" | "inferred" | "calculated";
  pageNumber: number;
  bbox?: OCRBoundingBox;
}

export interface ExtractedDocument {
  type: DocumentType;
  confidence: number;
  fields: Record<string, OCRField>;
  rawText: string;
  pages: OCRPage[];
  tables: OCRTable[];
  metadata: DocumentMetadata;
}

export type DocumentType =
  | "invoice"
  | "purchase_order"
  | "receipt"
  | "contract"
  | "form"
  | "letter"
  | "report"
  | "resume"
  | "unknown";

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  pageCount: number;
  createdAt?: Date;
  detectedType?: DocumentType;
  encoding?: string;
}

export interface ProcessedDocument {
  id: string;
  status: DocumentStatus;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  pageCount: number;
  ocrResult?: OCRResult;
  extracted?: ExtractedDocument;
  structuredData?: Record<string, unknown>;
  chunks?: DocumentChunk[];
  error?: string;
  processingTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "ocr_required"
  | "ocr_processing"
  | "extracting"
  | "partially_extracted"
  | "completed"
  | "extraction_failed"
  | "needs_review"
  | "failed";

export interface DocumentChunk {
  id: string;
  documentId: string;
  pageNumber: number;
  blockIndex: number;
  text: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  documentId: string;
  pageNumber: number;
  blockType: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
  source: string;
  mimeType: string;
  createdAt: Date;
}

/**
 * Validation settings applied to image buffers before OCR. These describe
 * checks only; no pixels are modified (see lib/ocr/preprocess.ts).
 */
export interface OCRPreprocessOptions {
  /** Reject buffers larger than this many bytes. */
  maxBytes: number;
  /** Verify that the buffer starts with a recognized image magic header. */
  verifyImageHeader: boolean;
}
