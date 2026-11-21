import { readFile } from "fs/promises";
import type {
  OCRResult,
  OCRPage,
  DocumentType,
  DocumentMetadata,
  OCRField,
  OCRPreprocessOptions,
} from "./types";
import { getOCRConfig, needsOCR, detectMimeType, isImageFile, isPDFFile, isDocumentFile } from "./config";
import { ocrImage, buildOCRResult, type OCRResultOverrides } from "./tesseract";
import { preprocessImage, DEFAULT_PREPROCESS_OPTIONS } from "./preprocess";

const SCANNED_PDF_WARNING =
  "This PDF appears to contain scanned images. OCR of scanned PDFs is not available, " +
  "so no text was extracted from those pages. The document needs manual review.";

/**
 * Build a page from text that was extracted deterministically (a PDF text
 * layer, a DOCX or a plain text file). Confidence 1 means the text was read
 * verbatim from the file — no OCR inference was involved.
 */
function createTextPage(pageNumber: number, text: string, confidence: number): OCRPage {
  return {
    pageNumber,
    width: 0,
    height: 0,
    blocks: [
      {
        text,
        confidence,
        bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
        type: "text",
        lines: [{ text, confidence, bbox: { x0: 0, y0: 0, x1: 0, y1: 0 }, words: [] }],
      },
    ],
    tables: [],
    fullText: text,
    averageConfidence: confidence,
    processingTimeMs: 0,
  };
}

export async function processFile(
  filePath: string,
  fileName: string,
  options?: { preprocess?: boolean; preprocessOptions?: Partial<OCRPreprocessOptions> }
): Promise<{ ocrResult: OCRResult; metadata: DocumentMetadata }> {
  const startTime = Date.now();
  const mimeType = detectMimeType(fileName);
  const config = getOCRConfig();
  const buffer = await readFile(filePath);
  const metadata: DocumentMetadata = {
    fileName,
    fileSize: buffer.length,
    mimeType,
    pageCount: 0,
  };

  let pages: OCRPage[] = [];
  let resultOverrides: OCRResultOverrides | undefined;

  if (isImageFile(mimeType)) {
    metadata.pageCount = 1;
    const imgBuffer =
      options?.preprocess !== false
        ? await preprocessImage(buffer, options?.preprocessOptions || DEFAULT_PREPROCESS_OPTIONS)
        : buffer;
    // Tesseract returns real 0-100 confidence values; ocrImage normalizes them.
    pages = [await ocrImage(imgBuffer)];
  } else if (isPDFFile(mimeType)) {
    const pdfParse = (await import("pdf-parse")).default;
    const pageTexts: string[] = [];
    const pdfData = await pdfParse(buffer, {
      pagerender: async (pageData) => {
        const textContent = await pageData.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ").trim();
        pageTexts.push(pageText);
        return pageText;
      },
    });
    metadata.pageCount = pdfData.numpages;

    const pdfNeedsOCR = needsOCR(pdfData.text);
    const maxPages = Math.min(pdfData.numpages, config.maxPages);
    for (let i = 0; i < maxPages; i++) {
      const text = pageTexts[i] ?? "";
      // A page with no usable text layer is left empty with zero confidence.
      pages.push(createTextPage(i + 1, text, needsOCR(text) ? 0 : 1));
    }

    // pdf-parse exposes only the text layer, not rendered page images, so a
    // scanned PDF cannot be sent to Tesseract here. Never claim success.
    if (pdfNeedsOCR) {
      resultOverrides = {
        needsReview: true,
        averageConfidence: 0,
        warning: SCANNED_PDF_WARNING,
      };
    }
  } else if (isDocumentFile(mimeType)) {
    metadata.pageCount = 1;
    let text: string;
    if (fileName.toLowerCase().endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf-8");
    }
    pages = [createTextPage(1, text, 1)];
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const ocrResult = buildOCRResult(pages, config.provider, config.language, resultOverrides);
  ocrResult.processingTimeMs = Date.now() - startTime;

  return { ocrResult, metadata };
}

export async function detectDocumentType(
  text: string
): Promise<{ type: DocumentType; confidence: number }> {
  const lower = text.toLowerCase();

  const patterns: { type: DocumentType; patterns: RegExp[]; minMatches: number }[] = [
    {
      type: "invoice",
      patterns: [/invoice/i, /bill\s*to/i, /payment\s*terms/i, /total\s*due/i, /amount\s*due/i],
      minMatches: 2,
    },
    {
      type: "purchase_order",
      patterns: [/purchase\s*order/i, /po\s*number/i, /ship\s*to/i, /bill\s*to/i, /item.*quantity.*price/i],
      minMatches: 2,
    },
    {
      type: "receipt",
      patterns: [/receipt/i, /transaction/i, /subtotal/i, /tax/i, /paid/i, /change\s*due/i],
      minMatches: 2,
    },
    {
      type: "contract",
      patterns: [/agreement/i, /party/i, /terms\s*and\s*conditions/i, /signature/i, /whereas/i],
      minMatches: 2,
    },
    {
      type: "resume",
      patterns: [/resume/i, /cv/i, /experience/i, /education/i, /skills/i, /objective/i],
      minMatches: 2,
    },
    {
      type: "form",
      patterns: [/form/i, /field/i, /checkbox/i, /signature\s*date/i, /please\s*fill/i],
      minMatches: 2,
    },
    {
      type: "letter",
      patterns: [/dear/i, /sincerely/i, /regards/i, /subject:/i, /re:/i],
      minMatches: 1,
    },
    {
      type: "report",
      patterns: [/report/i, /summary/i, /findings/i, /recommendation/i, /analysis/i],
      minMatches: 2,
    },
  ];

  let bestMatch: { type: DocumentType; confidence: number } = {
    type: "unknown",
    confidence: 0,
  };

  for (const { type, patterns: pats, minMatches } of patterns) {
    const matches = pats.filter((p) => p.test(lower)).length;
    if (matches >= minMatches) {
      const confidence = Math.min(0.95, 0.5 + matches * 0.1);
      if (confidence > bestMatch.confidence) {
        bestMatch = { type, confidence };
      }
    }
  }

  return bestMatch;
}

export function extractFieldsFromText(
  text: string,
  docType: DocumentType,
  pageNumber: number = 1
): Record<string, OCRField> {
  const fields: Record<string, OCRField> = {};

  const patterns: Record<string, { regex: RegExp; group?: number }[]> = {
    invoiceNumber: [
      { regex: /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i },
      { regex: /inv[\s-]*(\d[\w-]*)/i },
    ],
    date: [
      { regex: /date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i },
      { regex: /(\w+\s+\d{1,2},?\s+\d{4})/i },
    ],
    total: [
      { regex: /(?:total|amount\s*due|balance\s*due)\s*:?\s*\$?\s*([\d,]+\.?\d*)/i },
    ],
    subtotal: [
      { regex: /subtotal\s*:?\s*\$?\s*([\d,]+\.?\d*)/i },
    ],
    tax: [
      { regex: /(?:tax|vat|gst)\s*:?\s*\$?\s*([\d,]+\.?\d*)/i },
    ],
    vendor: [
      { regex: /(?:from|vendor|supplier|billed?\s*by)\s*:?\s*(.+)/i },
    ],
    customer: [
      { regex: /(?:bill?\s*to|customer|client|sold\s*to)\s*:?\s*(.+)/i },
    ],
    poNumber: [
      { regex: /po\s*#?\s*:?\s*([A-Z0-9-]+)/i },
      { regex: /purchase\s*order\s*#?\s*:?\s*([A-Z0-9-]+)/i },
    ],
    dueDate: [
      { regex: /due\s*date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i },
    ],
    paymentTerms: [
      { regex: /payment\s*terms?\s*:?\s*(.+)/i },
    ],
  };

  for (const [fieldName, fieldPatterns] of Object.entries(patterns)) {
    for (const { regex } of fieldPatterns) {
      const match = text.match(regex);
      if (match) {
        const value = (match[1] || match[0]).trim();
        fields[fieldName] = {
          name: fieldName,
          value,
          confidence: 0.8,
          source: "ocr",
          pageNumber,
        };
        break;
      }
    }
  }

  return fields;
}
