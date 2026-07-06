import { renderToBuffer } from "@react-pdf/renderer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ReportDocument } from "@/lib/pdf/report-document";
import type { DietReport } from "@/lib/schemas";

let _logoCache: string | null | undefined;

/**
 * Load /public/logo.png once and cache it as a data URI for embedding in the
 * PDF. Returns undefined if no logo file is present (the cover then falls back
 * to the "LEANR" wordmark).
 */
async function loadLogoDataUri(): Promise<string | undefined> {
  if (_logoCache !== undefined) return _logoCache ?? undefined;
  try {
    const file = path.join(process.cwd(), "public", "logo.png");
    const buf = await fs.readFile(file);
    _logoCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    _logoCache = null; // remember "no logo" so we don't hit the FS every time
  }
  return _logoCache ?? undefined;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Render the branded LEANR report PDF and return it as a Buffer. */
export async function renderReportPdf(params: {
  report: DietReport;
  reportId: string;
  generatedAt?: Date;
}): Promise<Buffer> {
  const logoDataUri = await loadLogoDataUri();
  const generatedAt = formatDate(params.generatedAt ?? new Date());

  return renderToBuffer(
    ReportDocument({
      report: params.report,
      reportId: params.reportId,
      logoDataUri,
      generatedAt,
    }),
  );
}
