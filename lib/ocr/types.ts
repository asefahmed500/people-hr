export type OCRProviderName = "tesseract" | "google" | "aws" | "azure";

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

export interface OCRPreprocessOptions {
  deskew: boolean;
  rotate: boolean;
  denoise: boolean;
  contrast: boolean;
  normalizeResolution: boolean;
  targetDpi: number;
}
