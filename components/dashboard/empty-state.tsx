import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-secondary">
        <FileText className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No reports yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Upload a client&apos;s diet PDF to generate your first premium LEANR
        nutrition report.
      </p>
      <Button asChild variant="brand" className="mt-5">
        <Link href="/dashboard">
          Create a report <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
