"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Eye, Download, FileDown, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteReport, getOriginalPdfUrl } from "@/app/(dashboard)/reports/actions";
import type { ReportRow } from "@/lib/types";

export function ReportActions({ report }: { report: ReportRow }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const canDownload = report.status === "completed";

  async function handleOriginal() {
    const { url, error } = await getOriginalPdfUrl(report.id);
    if (error || !url) {
      toast.error(error || "Original file unavailable.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleDelete() {
    if (!confirm(`Delete the report for “${report.client_name}”? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const { error } = await deleteReport(report.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Report deleted.");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Report actions" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/reports/${report.id}`}>
            <Eye className="size-4" /> View report
          </Link>
        </DropdownMenuItem>
        {canDownload ? (
          <DropdownMenuItem asChild>
            <a href={`/api/reports/${report.id}/pdf?download=1`}>
              <Download className="size-4" /> Download PDF
            </a>
          </DropdownMenuItem>
        ) : null}
        {report.original_pdf_path ? (
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOriginal(); }}>
            <FileDown className="size-4" /> Original upload
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onSelect={(e) => {
            e.preventDefault();
            handleDelete();
          }}
        >
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
