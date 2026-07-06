import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ReportRow } from "@/lib/types";

/** All reports for the currently authenticated user (RLS-scoped). */
export async function listReports(): Promise<ReportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** A single report by id (RLS ensures ownership). Returns null if not found. */
export async function getReport(id: string): Promise<ReportRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/** Lightweight stats for the dashboard header. */
export async function getReportStats() {
  const reports = await listReports();
  return {
    total: reports.length,
    completed: reports.filter((r) => r.status === "completed").length,
    processing: reports.filter((r) => r.status === "processing").length,
    failed: reports.filter((r) => r.status === "failed").length,
  };
}
