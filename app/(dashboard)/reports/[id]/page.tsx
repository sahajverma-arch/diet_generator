import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { ArrowLeft, AlertTriangle, Loader2, FileText, LayoutGrid } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ReportDetail } from "@/components/dashboard/report-detail";
import { PdfPreview } from "@/components/dashboard/pdf-preview";
import { DownloadButtons } from "@/components/dashboard/download-buttons";
import { getReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  return { title: report ? `${report.client_name} — Report` : "Report" };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to history
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{report.client_name}</h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.source_filename ? `${report.source_filename} · ` : ""}
            Created {format(new Date(report.created_at), "d MMM yyyy, HH:mm")}
            {report.model ? ` · ${report.model}` : ""}
          </p>
        </div>
        {report.status === "completed" ? (
          <DownloadButtons reportId={report.id} hasOriginal={!!report.original_pdf_path} />
        ) : null}
      </div>

      {report.status === "failed" ? (
        <Card className="border-red-200">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-700">Generation failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {report.error_message || "An unknown error occurred."}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/dashboard">Try another upload</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : report.status === "processing" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Loader2 className="size-6 animate-spin text-brand-black" />
            <p className="font-medium">This report is still processing.</p>
            <p className="text-sm text-muted-foreground">
              Refresh in a few moments to see the result.
            </p>
          </CardContent>
        </Card>
      ) : report.report_data ? (
        <Tabs defaultValue="report">
          <TabsList>
            <TabsTrigger value="report">
              <LayoutGrid className="mr-1.5 size-4" /> Report
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="mr-1.5 size-4" /> PDF preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="report">
            <ReportDetail report={report.report_data} />
          </TabsContent>
          <TabsContent value="pdf">
            <PdfPreview reportId={report.id} />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
