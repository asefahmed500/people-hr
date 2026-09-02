import type { OCRPreprocessOptions, OCRBoundingBox, OCRWord, OCRLine, OCRBlock, OCRPage, OCRResult, OCRProviderName } from "./types";
import { DEFAULT_PREPROCESS_OPTIONS, getOCRConfig } from "./config";
import { createWorker, type Worker } from "tesseract.js";

let _worker: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (_worker) return _worker;
  _worker = await createWorker("eng", 1, {
    logger: () => {},
  });
  return _worker;
}

function groupWordsIntoLines(words: OCRWord[]): OCRLine[] {
  const sorted = [...words].sort((a, b) => {
    const yDiff = a.bbox.y0 - b.bbox.y0;
    if (Math.abs(yDiff) < 5) return a.bbox.x0 - b.bbox.x0;
    return yDiff;
  });

  const lines: OCRLine[] = [];
  let currentLine: OCRWord[] = [];
  let currentY = -1;

  for (const word of sorted) {
    const wordY = Math.round(word.bbox.y0 / 5) * 5;
    if (currentY === -1 || Math.abs(wordY - currentY) < 8) {
      currentLine.push(word);
      currentY = wordY;
    } else {
      if (currentLine.length > 0) {
        lines.push(buildLine(currentLine));
      }
      currentLine = [word];
      currentY = wordY;
    }
  }
  if (currentLine.length > 0) lines.push(buildLine(currentLine));
  return lines;
}

function buildLine(words: OCRWord[]): OCRLine {
  const text = words
    .sort((a, b) => a.bbox.x0 - b.bbox.x0)
    .map((w) => w.text)
    .join(" ");
  const avgConfidence =
    words.reduce((s, w) => s + w.confidence, 0) / words.length;
  return {
    text,
    confidence: avgConfidence,
    bbox: {
      x0: Math.min(...words.map((w) => w.bbox.x0)),
      y0: Math.min(...words.map((w) => w.bbox.y0)),
      x1: Math.max(...words.map((w) => w.bbox.x1)),
      y1: Math.max(...words.map((w) => w.bbox.y1)),
    },
    words,
  };
}

function groupLinesIntoBlocks(lines: OCRLine[]): OCRBlock[] {
  const blocks: OCRBlock[] = [];
  let currentBlock: OCRLine[] = [];
  let lastY1 = -1;

  for (const line of lines) {
    const gap = lastY1 === -1 ? 0 : line.bbox.y0 - lastY1;
    if (lastY1 !== -1 && gap > 20) {
      if (currentBlock.length > 0) blocks.push(buildBlock(currentBlock));
      currentBlock = [];
    }
    currentBlock.push(line);
    lastY1 = line.bbox.y1;
  }
  if (currentBlock.length > 0) blocks.push(buildBlock(currentBlock));
  return blocks;
}

function buildBlock(lines: OCRLine[]): OCRBlock {
  const text = lines.map((l) => l.text).join("\n");
  const avgConfidence =
    lines.reduce((s, l) => s + l.confidence, 0) / lines.length;
  const firstLine = lines[0];
  const isHeading =
    lines.length === 1 &&
    firstLine.words.some((w) => w.confidence > 90 && w.bbox.y1 - w.bbox.y0 > 20);

  return {
    text,
    confidence: avgConfidence,
    bbox: {
      x0: Math.min(...lines.map((l) => l.bbox.x0)),
      y0: Math.min(...lines.map((l) => l.bbox.y0)),
      x1: Math.max(...lines.map((l) => l.bbox.x1)),
      y1: Math.max(...lines.map((l) => l.bbox.y1)),
    },
    type: isHeading ? "heading" : "text",
    lines,
  };
}

function detectTables(lines: OCRLine[]): { text: string; bbox: OCRBoundingBox; confidence: number }[] {
  const tables: { text: string; bbox: OCRBoundingBox; confidence: number }[] = [];
  const tablePatterns = [
    /\|.*\|.*\|/,
    /\t.*\t.*\t/,
    /^\s*[-=+]{3,}\s*$/gm,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = tablePatterns.some((p) => p.test(line.text));
    if (isTableRow) {
      const tableLines = [line];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const isNextRow = tablePatterns.some((p) => p.test(nextLine.text));
        const isCloseVertically = nextLine.bbox.y0 - tableLines[tableLines.length - 1].bbox.y1 < 15;
        if (!isNextRow && !isCloseVertically) break;
        tableLines.push(nextLine);
        j++;
      }
      if (tableLines.length >= 2) {
        const tableText = tableLines.map((l) => l.text).join("\n");
        const avgConf =
          tableLines.reduce((s, l) => s + l.confidence, 0) / tableLines.length;
        tables.push({
          text: tableText,
          bbox: {
            x0: Math.min(...tableLines.map((l) => l.bbox.x0)),
            y0: Math.min(...tableLines.map((l) => l.bbox.y0)),
            x1: Math.max(...tableLines.map((l) => l.bbox.x1)),
            y1: Math.max(...tableLines.map((l) => l.bbox.y1)),
          },
          confidence: avgConf,
        });
        i = j - 1;
      }
    }
  }
  return tables;
}

export async function ocrImage(
  imageBuffer: Buffer,
  options?: Partial<OCRPreprocessOptions>
): Promise<OCRPage> {
  const startTime = Date.now();
  const worker = await getWorker();
  const opts = { ...DEFAULT_PREPROCESS_OPTIONS, ...options };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognized = await worker.recognize(imageBuffer) as any;
  const { words, text, confidence } = recognized.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ocrWords: OCRWord[] = words.map((w: any) => ({
    text: w.text,
    confidence: w.confidence,
    bbox: {
      x0: w.bbox.x0,
      y0: w.bbox.y0,
      x1: w.bbox.x1,
      y1: w.bbox.y1,
    },
  }));

  const ocrLines = groupWordsIntoLines(ocrWords);
  const blocks = groupLinesIntoBlocks(ocrLines);
  const tables = detectTables(ocrLines);

  return {
    pageNumber: 1,
    width: 0,
    height: 0,
    blocks,
    tables: tables.map((t) => ({
      rows: t.text.split("\n").map((r) => r.split(/[|\t]/).map((c) => c.trim())),
      bbox: t.bbox,
      confidence: t.confidence,
    })),
    fullText: text,
    averageConfidence: confidence,
    processingTimeMs: Date.now() - startTime,
  };
}

export async function ocrPDFPages(
  pageBuffers: Buffer[],
  options?: Partial<OCRPreprocessOptions>
): Promise<OCRPage[]> {
  const pages: OCRPage[] = [];
  for (let i = 0; i < pageBuffers.length; i++) {
    const page = await ocrImage(pageBuffers[i], options);
    page.pageNumber = i + 1;
    pages.push(page);
  }
  return pages;
}

export function buildOCRResult(pages: OCRPage[], provider: OCRProviderName, language: string): OCRResult {
  const avgConfidence =
    pages.reduce((s, p) => s + p.averageConfidence, 0) / Math.max(pages.length, 1);
  const fullText = pages.map((p) => p.fullText).join("\n\n");
  const config = getOCRConfig();

  return {
    pages,
    fullText,
    averageConfidence: avgConfidence,
    totalPages: pages.length,
    processingTimeMs: pages.reduce((s, p) => s + p.processingTimeMs, 0),
    provider,
    language,
    needsReview: avgConfidence < config.confidenceThreshold * 100,
  };
}

export async function terminateOCR(): Promise<void> {
  if (_worker) {
    await _worker.terminate();
    _worker = null;
  }
}
