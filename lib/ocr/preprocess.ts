import type { OCRPreprocessOptions } from "./types";
import { DEFAULT_PREPROCESS_OPTIONS } from "./config";

export async function preprocessImage(
  imageBuffer: Buffer,
  options?: Partial<OCRPreprocessOptions>
): Promise<Buffer> {
  return imageBuffer;
}

export async function detectOrientation(_imageBuffer: Buffer): Promise<number> {
  return 0;
}

export async function deskewImage(imageBuffer: Buffer): Promise<Buffer> {
  return imageBuffer;
}

export { DEFAULT_PREPROCESS_OPTIONS };
