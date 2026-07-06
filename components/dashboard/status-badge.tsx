import { Badge } from "@/components/ui/badge";
import type { ReportStatus } from "@/lib/types";

const MAP: Record<
  ReportStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  completed: { label: "Completed", variant: "success" },
  processing: { label: "Processing", variant: "warning" },
  failed: { label: "Failed", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, variant } = MAP[status] ?? MAP.processing;
  return <Badge variant={variant}>{label}</Badge>;
}
