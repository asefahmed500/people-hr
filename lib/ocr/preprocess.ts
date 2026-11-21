import type { OCRPreprocessOptions } from "./types";
import { DEFAULT_PREPROCESS_OPTIONS } from "./config";

export class OCRPreprocessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OCRPreprocessError";
  }
}

interface Signature {
  mimeType: string;
  /** Byte pattern that must match at the start of the buffer. */
  bytes: number[];
  /** Optional second pattern at a fixed offset (used by WebP). */
  extra?: { offset: number; bytes: number[] };
}

const IMAGE_SIGNATURES: Signature[] = [
  { mimeType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mimeType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mimeType: "image/bmp", bytes: [0x42, 0x4d] },
  {
    mimeType: "image/webp",
    bytes: [0x52, 0x49, 0x46, 0x46], // RIFF
    extra: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
  },
  { mimeType: "image/tiff", bytes: [0x49, 0x49, 0x2a, 0x00] }, // little-endian
  { mimeType: "image/tiff", bytes: [0x4d, 0x4d, 0x00, 0x2a] }, // big-endian
];

function matches(buffer: Buffer, offset: number, bytes: number[]): boolean {
  if (offset < 0 || offset + bytes.length > buffer.length) return false;
  return bytes.every((byte, i) => buffer[offset + i] === byte);
}

/**
 * Identify a supported image format from its magic header.
 * Returns null when the header is unknown or truncated.
 */
export function detectImageFormat(buffer: Buffer): string | null {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  for (const signature of IMAGE_SIGNATURES) {
    if (!matches(buffer, 0, signature.bytes)) continue;
    if (signature.extra && !matches(buffer, signature.extra.offset, signature.extra.bytes)) {
      continue;
    }
    return signature.mimeType;
  }
  return null;
}

/**
 * Validate an image buffer before handing it to Tesseract.
 *
 * This function performs validation only. It rejects empty, oversized and
 * unsupported/corrupt buffers, but it does NOT deskew, rotate, denoise,
 * adjust contrast or resample the image — the buffer is returned unchanged.
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  options?: Partial<OCRPreprocessOptions>
): Promise<Buffer> {
  const opts = { ...DEFAULT_PREPROCESS_OPTIONS, ...options };

  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new OCRPreprocessError("Image buffer is empty or invalid");
  }
  if (imageBuffer.length > opts.maxBytes) {
    throw new OCRPreprocessError(
      `Image is too large for OCR (${imageBuffer.length} bytes, max ${opts.maxBytes})`
    );
  }
  if (opts.verifyImageHeader && detectImageFormat(imageBuffer) === null) {
    throw new OCRPreprocessError(
      "Unsupported or corrupt image: unrecognized file header"
    );
  }

  return imageBuffer;
}

/**
 * Read the EXIF `Orientation` tag (1-8) from a JPEG or TIFF buffer.
 * Returns 0 when the tag is absent or unreadable.
 *
 * This only reports the embedded metadata; no rotation is applied to the
 * pixels. Callers may use the value to decide whether an image needs review.
 */
export function detectOrientation(imageBuffer: Buffer): number {
  const format = detectImageFormat(imageBuffer);
  let tiffStart = -1;

  if (format === "image/tiff") {
    tiffStart = 0;
  } else if (format === "image/jpeg") {
    let offset = 2; // skip SOI
    while (offset + 4 <= imageBuffer.length) {
      if (imageBuffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = imageBuffer[offset + 1];
      if (marker === 0xd8 || marker === 0x01) {
        offset += 2;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) break; // EOI / start of scan
      const segmentLength = imageBuffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) break;
      if (
        marker === 0xe1 &&
        offset + 10 <= imageBuffer.length &&
        imageBuffer.toString("ascii", offset + 4, offset + 10) === "Exif\0\0"
      ) {
        tiffStart = offset + 10;
        break;
      }
      offset += 2 + segmentLength;
    }
  } else {
    return 0;
  }

  if (tiffStart < 0 || tiffStart + 8 > imageBuffer.length) return 0;

  const byteOrder = imageBuffer.toString("ascii", tiffStart, tiffStart + 2);
  const littleEndian = byteOrder === "II";
  if (!littleEndian && byteOrder !== "MM") return 0;

  const readU16 = (at: number): number =>
    littleEndian ? imageBuffer.readUInt16LE(at) : imageBuffer.readUInt16BE(at);
  const readU32 = (at: number): number =>
    littleEndian ? imageBuffer.readUInt32LE(at) : imageBuffer.readUInt32BE(at);

  if (readU16(tiffStart + 2) !== 42) return 0; // TIFF magic

  const ifd = tiffStart + readU32(tiffStart + 4);
  if (ifd + 2 > imageBuffer.length) return 0;
  const entryCount = readU16(ifd);

  for (let i = 0; i < entryCount; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > imageBuffer.length) break;
    if (readU16(entry) !== 0x0112) continue; // Orientation tag
    if (readU16(entry + 2) !== 3) return 0; // must be SHORT
    const orientation = readU16(entry + 8);
    return orientation >= 1 && orientation <= 8 ? orientation : 0;
  }

  return 0;
}

export { DEFAULT_PREPROCESS_OPTIONS };
