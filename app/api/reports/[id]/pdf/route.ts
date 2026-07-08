import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReport } from "@/lib/reports";
import { downloadObject } from "@/lib/storage";
import { renderReportPdf } from "@/lib/pdf/generate";
import { slugify, errorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const report = await getReport(id); // RLS scopes to the current user
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  // `?refresh=1` re-renders from the stored report_data instead of serving the
  // cached PDF — handy for seeing renderer/layout changes on an existing report
  // without re-uploading. Falls back to a live render if no stored PDF exists.
  const forceRefresh = requestUrl.searchParams.get("refresh") === "1";

  try {
    let pdf: Buffer;
    if (report.final_pdf_path && !forceRefresh) {
      pdf = await downloadObject(report.final_pdf_path);
    } else if (report.report_data) {
      // Regenerate on demand (stored PDF missing, or a refresh was requested).
      pdf = await renderReportPdf({ report: report.report_data, reportId: report.id });
    } else {
      return NextResponse.json(
        { error: "This report has no PDF available yet." },
        { status: 409 },
      );
    }

    const download = requestUrl.searchParams.get("download") === "1";
    const filename = `leanr-diet-report-${slugify(report.client_name) || "report"}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Could not load PDF: ${errorMessage(error)}` },
      { status: 500 },
    );
  }
}
