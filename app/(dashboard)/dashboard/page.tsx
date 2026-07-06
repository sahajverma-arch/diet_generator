import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadForm } from "@/components/dashboard/upload-form";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ReportsTable } from "@/components/dashboard/reports-table";
import { listReports } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const reports = await listReports();
  const stats = {
    total: reports.length,
    completed: reports.filter((r) => r.status === "completed").length,
    processing: reports.filter((r) => r.status === "processing").length,
    failed: reports.filter((r) => r.status === "failed").length,
  };
  const recent = reports.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-medium text-brand-black">
          <Sparkles className="size-3.5" /> AI-powered
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Diet Report Generator</h1>
        <p className="text-muted-foreground">
          Upload a client&apos;s diet PDF and get a premium, on-brand nutrition report.
        </p>
      </div>

      <StatCards stats={stats} />

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>New report</CardTitle>
            <CardDescription>
              We&apos;ll extract the plan, analyse it with AI, and render a LEANR-branded PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Four steps, fully automated.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {[
                "Upload the client's diet PDF (text-based).",
                "AI extracts calories, macros, micronutrients & meals.",
                "It adds workout, hydration & recovery guidance.",
                "Download a premium, LEANR-branded PDF report.",
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-xs font-bold text-brand-black">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent reports</h2>
          {reports.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/reports">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
        </div>
        <ReportsTable reports={recent} />
      </section>
    </div>
  );
}
