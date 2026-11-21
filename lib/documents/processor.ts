import { randomUUID } from "crypto";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import type {
  ProcessedDocument,
  ExtractedDocument,
  OCRResult,
  OCRField,
} from "../ocr/types";
import { processFile, detectDocumentType, extractFieldsFromText } from "../ocr/pipeline";
import { detectMimeType, isOCRSupported } from "../ocr/config";
import { getAIService } from "../ai/service";
import { z } from "zod";

const UPLOAD_DIR = join(process.cwd(), "tmp", "uploads");

async function ensureDir(dir: string) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

export interface DocumentProcessorOptions {
  userId: string;
  preprocess?: boolean;
  extractFields?: boolean;
  classifyType?: boolean;
  chunkForRAG?: boolean;
}

export class DocumentProcessor {
  private ai = getAIService();

  async processUpload(
    fileBuffer: Buffer,
    fileName: string,
    options: DocumentProcessorOptions
  ): Promise<ProcessedDocument> {
    const docId = randomUUID();
    const startTime = Date.now();
    const mimeType = detectMimeType(fileName);

    const doc: ProcessedDocument = {
      id: docId,
      status: "uploaded",
      type: "unknown",
      fileName,
      mimeType,
      fileSize: fileBuffer.length,
      pageCount: 0,
      processingTimeMs: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: options.userId,
    };

    await ensureDir(UPLOAD_DIR);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 200);
    const filePath = join(UPLOAD_DIR, `${docId}_${safeName}`);
    await writeFile(filePath, fileBuffer);

    try {
      if (!isOCRSupported(mimeType)) {
        doc.status = "extraction_failed";
        doc.error = `Unsupported file type: ${mimeType}`;
        return doc;
      }

      doc.status = "ocr_processing";
      const { ocrResult, metadata } = await processFile(filePath, fileName, {
        preprocess: options.preprocess,
      });

      doc.ocrResult = ocrResult;
      doc.pageCount = metadata.pageCount;
      doc.status = "extracting";

      if (options.classifyType !== false) {
        const { type, confidence } = await detectDocumentType(ocrResult.fullText);
        doc.type = type;
        if (confidence < 0.4) doc.type = "unknown";
      }

      if (options.extractFields !== false && doc.type !== "unknown") {
        doc.extracted = await this.extractStructured(doc, ocrResult);
      }

      if (ocrResult.needsReview) {
        doc.status = "needs_review";
      } else if (doc.extracted) {
        doc.status = "completed";
      } else {
        doc.status = "partially_extracted";
      }
    } catch (e) {
      doc.status = "extraction_failed";
      doc.error = (e as Error).message;
    } finally {
      try { await unlink(filePath); } catch {}
      doc.processingTimeMs = Date.now() - startTime;
      doc.updatedAt = new Date();
    }

    return doc;
  }

  private async extractStructured(
    doc: ProcessedDocument,
    ocrResult: OCRResult
  ): Promise<ExtractedDocument> {
    const text = ocrResult.fullText;
    const fieldsFromOCR = extractFieldsFromText(text, doc.type);

    const aiExtractedFields: Record<string, OCRField> = {};
    try {
      const extractionPrompt = `Extract structured fields from this ${doc.type} document. Return JSON with fields like: documentNumber, vendor, customer, date, dueDate, currency, subtotal, tax, total, lineItems (array of {description, quantity, unitPrice, amount}).

Document text:
${text.substring(0, 4000)}

Return ONLY valid JSON.`;

      const result = await this.ai.structuredGenerate(
        [
          { role: "system", content: "You are a document extraction assistant. Extract fields from documents accurately. If a field is not found, set confidence to 0 and value to empty string." },
          { role: "user", content: extractionPrompt },
        ],
        z.record(
          z.string(),
          z.object({
            value: z.string(),
            confidence: z.number().min(0).max(1),
            source: z.enum(["ocr", "inferred", "calculated"]),
          })
        )
      );

      for (const [key, val] of Object.entries(result.data)) {
        aiExtractedFields[key] = {
          name: key,
          value: val.value,
          confidence: val.confidence,
          source: val.source as "ocr" | "inferred" | "calculated",
          pageNumber: 1,
        };
      }
    } catch {}

    const mergedFields: Record<string, OCRField> = {};
    const allKeys = new Set([...Object.keys(fieldsFromOCR), ...Object.keys(aiExtractedFields)]);
    for (const key of allKeys) {
      const ocrField = fieldsFromOCR[key];
      const aiField = aiExtractedFields[key];
      if (ocrField && aiField) {
        mergedFields[key] = ocrField.confidence >= aiField.confidence ? ocrField : aiField;
      } else {
        mergedFields[key] = ocrField || aiField;
      }
    }

    return {
      type: doc.type,
      confidence: ocrResult.averageConfidence,
      fields: mergedFields,
      rawText: text,
      pages: ocrResult.pages,
      tables: ocrResult.pages.flatMap((p) => p.tables),
      metadata: {
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        pageCount: doc.pageCount,
        detectedType: doc.type,
      },
    };
  }

  async reprocess(doc: ProcessedDocument, options?: DocumentProcessorOptions): Promise<ProcessedDocument> {
    // Reserved for future reprocessing controls; kept for API compatibility.
    void options;
    doc.status = "processing";
    doc.updatedAt = new Date();
    doc.error = undefined;

    try {
      if (doc.extracted && doc.ocrResult) {
        doc.extracted = await this.extractStructured(doc, doc.ocrResult);
        doc.status = "completed";
      }
    } catch (e) {
      doc.status = "extraction_failed";
      doc.error = (e as Error).message;
    }

    return doc;
  }
}

let _processor: DocumentProcessor | null = null;

export function getDocumentProcessor(): DocumentProcessor {
  if (!_processor) _processor = new DocumentProcessor();
  return _processor;
}
