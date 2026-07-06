import type { Metadata } from "next";
import { ReportsTable } from "@/components/dashboard/reports-table";
import { listReports } from "@/lib/reports";

export const metadata: Metadata = { title: "Report history" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report history</h1>
        <p className="text-muted-foreground">
          {reports.length} report{reports.length === 1 ? "" : "s"} generated.
        </p>
      </div>
      <ReportsTable reports={reports} />
    </div>
  );
}
