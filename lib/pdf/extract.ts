// Import the library entry point directly. The package index runs a debug
// harness that reads a sample file from disk at import time and breaks under
// the Next.js bundler; the lib path is the clean, well-known workaround.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export class PdfExtractionError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

export interface ExtractedPdf {
  text: string;
  pages: number;
}

const NBSP = / /g;

/**
 * Extract plain text from a PDF buffer.
 * Throws PdfExtractionError for corrupt files or scanned/image-only PDFs that
 * contain no selectable text.
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractedPdf> {
  let result;
  try {
    result = await pdfParse(buffer);
  } catch (error) {
    throw new PdfExtractionError(
      "Could not read this PDF. It may be corrupted or password-protected.",
      error,
    );
  }

  const text = (result.text ?? "")
    .replace(NBSP, " ") // non-breaking spaces -> normal spaces
    .replace(/[ \t]+\n/g, "\n") // trailing whitespace on lines
    .replace(/\n{3,}/g, "\n\n") // collapse excessive blank lines
    .trim();

  if (text.length < 40) {
    throw new PdfExtractionError(
      "No readable text found in this PDF. If it is a scan or image, please upload a text-based PDF.",
    );
  }

  return { text, pages: result.numpages };
}
