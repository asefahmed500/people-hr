import { readFile } from "fs/promises";
import type {
  OCRConfig,
  OCRResult,
  OCRPage,
  DocumentType,
  DocumentMetadata,
  ExtractedDocument,
  OCRField,
  OCRPreprocessOptions,
} from "./types";
import { getOCRConfig, needsOCR, detectMimeType, isImageFile, isPDFFile, isDocumentFile } from "./config";
import { ocrImage, ocrPDFPages, buildOCRResult } from "./tesseract";
import { preprocessImage } from "./preprocess";
import { DEFAULT_PREPROCESS_OPTIONS } from "./config";

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

  if (isImageFile(mimeType)) {
    metadata.pageCount = 1;
    const imgBuffer =
      options?.preprocess !== false
        ? await preprocessImage(buffer, options?.preprocessOptions || DEFAULT_PREPROCESS_OPTIONS)
        : buffer;
    const page = await ocrImage(imgBuffer);
    pages = [page];
  } else if (isPDFFile(mimeType)) {
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    metadata.pageCount = pdfData.numpages;
    const maxPages = Math.min(pdfData.numpages, config.maxPages);

    if (needsOCR(pdfData.text)) {
      // When OCR is needed on a PDF, extract text per-page using pdf-parse's
      // built-in page callback. Each page gets its own OCR entry.
      const pageTexts: string[] = [];
      const parsePages = (await import("pdf-parse")).default;
      await parsePages(buffer, {
        pagerender: async (pageData: { getTextContent: () => Promise<{ items: { str: string }[] }> }) => {
          const text = await pageData.getTextContent();
          pageTexts.push(text.items.map((i) => i.str).join(" "));
          return "";
        },
      });

      for (let i = 0; i < Math.min(pageTexts.length, maxPages); i++) {
        const text = pageTexts[i] || "";
        if (needsOCR(text)) {
          // When the page text suggests it's a scanned image embedded in the PDF,
          // we fall back to treating the full text as the page content
          pages.push({
            pageNumber: i + 1,
            width: 0,
            height: 0,
            fullText: text,
            averageConfidence: 0.5,
            processingTimeMs: 0,
            tables: [],
            blocks: [{ text, confidence: 0.5, bbox: { x0: 0, y0: 0, x1: 1, y1: 1 }, type: "text" as const, lines: [] }],
          });
        } else {
          pages.push({
            pageNumber: i + 1,
            width: 0,
            height: 0,
            fullText: text,
            averageConfidence: 1.0,
            processingTimeMs: 0,
            tables: [],
            blocks: [{ text, confidence: 1.0, bbox: { x0: 0, y0: 0, x1: 1, y1: 1 }, type: "text" as const, lines: [] }],
          });
        }
      }
    } else {
      pages = [
        {
          pageNumber: 1,
          width: 0,
          height: 0,
          blocks: [
            {
              text: pdfData.text,
              confidence: 95,
              bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
              type: "text",
              lines: [
                {
                  text: pdfData.text,
                  confidence: 95,
                  bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
                  words: [],
                },
              ],
            },
          ],
          tables: [],
          fullText: pdfData.text,
          averageConfidence: 95,
          processingTimeMs: 0,
        },
      ];
    }
  } else if (isDocumentFile(mimeType)) {
    metadata.pageCount = 1;
    if (fileName.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      pages = [
        {
          pageNumber: 1,
          width: 0,
          height: 0,
          blocks: [
            {
              text: result.value,
              confidence: 95,
              bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
              type: "text",
              lines: [
                {
                  text: result.value,
                  confidence: 95,
                  bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
                  words: [],
                },
              ],
            },
          ],
          tables: [],
          fullText: result.value,
          averageConfidence: 95,
          processingTimeMs: 0,
        },
      ];
    } else {
      const text = buffer.toString("utf-8");
      pages = [
        {
          pageNumber: 1,
          width: 0,
          height: 0,
          blocks: [
            {
              text,
              confidence: 100,
              bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
              type: "text",
              lines: [
                {
                  text,
                  confidence: 100,
                  bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
                  words: [],
                },
              ],
            },
          ],
          tables: [],
          fullText: text,
          averageConfidence: 100,
          processingTimeMs: 0,
        },
      ];
    }
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const ocrResult = buildOCRResult(pages, config.provider, config.language);
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
