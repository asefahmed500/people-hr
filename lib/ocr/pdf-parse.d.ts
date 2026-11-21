declare module "pdf-parse" {
  export interface PDFTextContent {
    items: Array<{ str: string }>;
  }

  export interface PDFPageData {
    getTextContent(): Promise<PDFTextContent>;
  }

  export interface PDFParseOptions {
    /** Called once per page; its return value is appended to the full text. */
    pagerender?: (pageData: PDFPageData) => string | Promise<string>;
    /** Maximum number of pages to render (0 means all). */
    max?: number;
    version?: string;
  }

  export interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown> | null;
    metadata: unknown;
    text: string;
    version: string | null;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: PDFParseOptions
  ): Promise<PDFData>;

  export default pdfParse;
}
