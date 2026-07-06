import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}

const CONFIG = [
  { key: "total", label: "Total reports", icon: FileText, tint: "bg-secondary text-foreground" },
  { key: "completed", label: "Completed", icon: CheckCircle2, tint: "bg-emerald-100 text-emerald-700" },
  { key: "processing", label: "Processing", icon: Clock, tint: "bg-amber-100 text-amber-700" },
  { key: "failed", label: "Failed", icon: AlertTriangle, tint: "bg-red-100 text-red-700" },
] as const;

export function StatCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CONFIG.map(({ key, label, icon: Icon, tint }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex size-10 items-center justify-center rounded-lg ${tint}`}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{stats[key]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
