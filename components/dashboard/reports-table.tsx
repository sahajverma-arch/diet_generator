import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ReportActions } from "@/components/dashboard/report-actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { ReportRow } from "@/lib/types";

export function ReportsTable({ reports }: { reports: ReportRow[] }) {
  if (reports.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Client</TableHead>
            <TableHead className="hidden md:table-cell">Source file</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Created</TableHead>
            <TableHead className="w-10 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Link
                  href={`/reports/${report.id}`}
                  className="flex items-center gap-3 font-medium hover:underline"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-yellow/20">
                    <FileText className="size-4 text-brand-black" />
                  </span>
                  <span className="truncate">{report.client_name}</span>
                </Link>
              </TableCell>
              <TableCell className="hidden max-w-[220px] truncate text-sm text-muted-foreground md:table-cell">
                {report.source_filename ?? "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={report.status} />
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <ReportActions report={report} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
