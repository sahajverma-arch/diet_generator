/**
 * pdf-parse ships its debug/test harness in its package index, which tries to
 * read a bundled sample PDF from disk at import time and crashes under Next's
 * bundler. Importing the library entry point directly avoids that. This
 * declaration types that deep import.
 */
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    version: string;
    text: string;
  }
  function pdfParse(
    dataBuffer: Buffer,
    options?: Record<string, unknown>,
  ): Promise<PDFInfo>;
  export = pdfParse;
}
