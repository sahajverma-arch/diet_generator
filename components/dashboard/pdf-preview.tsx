"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

/**
 * Inline PDF preview backed by the auth-checked /pdf route. Shows a spinner
 * until the iframe finishes loading.
 */
export function PdfPreview({ reportId }: { reportId: string }) {
  const [loaded, setLoaded] = React.useState(false);
  const src = `/api/reports/${reportId}/pdf#toolbar=0&navpanes=0&view=FitH`;

  return (
    <div className="relative h-[78vh] w-full overflow-hidden rounded-xl border bg-muted/30">
      {!loaded ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Loading preview…</p>
        </div>
      ) : null}
      <iframe
        title="Diet report preview"
        src={src}
        className="h-full w-full"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
