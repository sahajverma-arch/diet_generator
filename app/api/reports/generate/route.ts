import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractPdfText, PdfExtractionError } from "@/lib/pdf/extract";
import { generateDietReport, DietReportGenerationError } from "@/lib/openai";
import { renderReportPdf } from "@/lib/pdf/generate";
import { uploadObject, storagePaths, removeReportObjects } from "@/lib/storage";
import { GenerateInputSchema } from "@/lib/schemas";
import { errorMessage } from "@/lib/utils";
import { serverEnv } from "@/lib/env";

// This route uses Node-only libraries (pdf-parse, @react-pdf/renderer) and must
// run on the Node runtime, not Edge.
export const runtime = "nodejs";
// Generation involves an LLM call + PDF render; give it room. (On Vercel Hobby
// the ceiling is 60s; Pro allows more — raise if you process large documents.)
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  // 1. Authenticate --------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // 2. Parse & validate input ---------------------------------------------
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const parsed = GenerateInputSchema.safeParse({
    clientName: formData.get("clientName"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { clientName } = parsed.data;

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const reportId = randomUUID();
  const admin = createAdminClient();

  // 3. Create a processing record so it appears in history immediately -----
  const { error: insertError } = await admin.from("reports").insert({
    id: reportId,
    user_id: user.id,
    client_name: clientName,
    status: "processing",
    source_filename: file.name,
    source_size_bytes: file.size,
    model: serverEnv.openaiModel,
  });
  if (insertError) {
    return NextResponse.json(
      { error: `Could not create report: ${insertError.message}` },
      { status: 500 },
    );
  }

  const markFailed = async (message: string) => {
    await admin
      .from("reports")
      .update({ status: "failed", error_message: message })
      .eq("id", reportId);
  };

  try {
    // 4. Persist the original upload first -------------------------------
    await uploadObject({
      path: storagePaths.original(user.id, reportId),
      body: buffer,
      contentType: "application/pdf",
    });

    // 5. Extract text ----------------------------------------------------
    const { text } = await extractPdfText(buffer);

    // 6. AI analysis -> structured JSON ----------------------------------
    const { data: report, model } = await generateDietReport({
      clientName,
      extractedText: text,
    });

    // 7. Store the JSON --------------------------------------------------
    await uploadObject({
      path: storagePaths.json(user.id, reportId),
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    });

    // 8. Render + store the branded PDF ----------------------------------
    const pdfBuffer = await renderReportPdf({ report, reportId });
    await uploadObject({
      path: storagePaths.final(user.id, reportId),
      body: pdfBuffer,
      contentType: "application/pdf",
    });

    // 9. Finalise the record ---------------------------------------------
    const { error: updateError } = await admin
      .from("reports")
      .update({
        status: "completed",
        model,
        report_data: report,
        client_name: report.client.name || clientName,
        original_pdf_path: storagePaths.original(user.id, reportId),
        json_path: storagePaths.json(user.id, reportId),
        final_pdf_path: storagePaths.final(user.id, reportId),
      })
      .eq("id", reportId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ id: reportId, status: "completed" });
  } catch (error) {
    const message =
      error instanceof PdfExtractionError || error instanceof DietReportGenerationError
        ? error.message
        : `Report generation failed: ${errorMessage(error)}`;

    await markFailed(message);
    // Best-effort cleanup of any partially-written artifacts.
    await removeReportObjects(user.id, reportId).catch(() => {});

    const status = error instanceof PdfExtractionError ? 422 : 500;
    return NextResponse.json({ error: message, id: reportId }, { status });
  }
}
