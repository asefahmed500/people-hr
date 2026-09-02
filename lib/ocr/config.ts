import type {
  OCRConfig,
  OCRProviderName,
  OCRResult,
  OCRPreprocessOptions,
} from "./types";
import { getAIEnv } from "../ai/env";

export function getOCRConfig(): OCRConfig {
  const env = getAIEnv();
  return {
    provider: env.OCR_PROVIDER as OCRProviderName,
    language: "eng",
    confidenceThreshold: env.OCR_CONFIDENCE_THRESHOLD,
    maxPages: env.OCR_MAX_PAGES,
    preprocess: true,
  };
}

export const DEFAULT_PREPROCESS_OPTIONS: OCRPreprocessOptions = {
  deskew: true,
  rotate: true,
  denoise: true,
  contrast: true,
  normalizeResolution: true,
  targetDpi: 300,
};

export function needsOCR(text: string | null | undefined): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length < 10) return true;
  const alphaRatio =
    (trimmed.match(/[a-zA-Z]/g) || []).length / Math.max(trimmed.length, 1);
  if (alphaRatio < 0.2) return true;
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < 3 && trimmed.length > 50) return true;
  return false;
}

export function detectMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    tiff: "image/tiff",
    tif: "image/tiff",
    bmp: "image/bmp",
    gif: "image/gif",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
    csv: "text/csv",
  };
  return mimeMap[ext || ""] || "application/octet-stream";
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isPDFFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function isDocumentFile(mimeType: string): boolean {
  return (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType === "text/plain" ||
    mimeType === "text/csv"
  );
}

export function isOCRSupported(mimeType: string): boolean {
  return (
    isImageFile(mimeType) ||
    isPDFFile(mimeType) ||
    isDocumentFile(mimeType)
  );
}

export function getMaxPages(mimeType: string): number {
  const config = getOCRConfig();
  if (isImageFile(mimeType)) return 1;
  return config.maxPages;
}
