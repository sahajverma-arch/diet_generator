"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOriginalPdfUrl } from "@/app/(dashboard)/reports/actions";

export function DownloadButtons({
  reportId,
  hasOriginal,
}: {
  reportId: string;
  hasOriginal: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  async function openOriginal() {
    setLoading(true);
    const { url, error } = await getOriginalPdfUrl(reportId);
    setLoading(false);
    if (error || !url) {
      toast.error(error || "Original file unavailable.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {hasOriginal ? (
        <Button variant="outline" onClick={openOriginal} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
          Original
        </Button>
      ) : null}
      <Button asChild variant="brand">
        <a href={`/api/reports/${reportId}/pdf?download=1`}>
          <Download className="size-4" /> Download PDF
        </a>
      </Button>
    </div>
  );
}
