import type { DietReport } from "@/lib/schemas";

export type ReportStatus = "processing" | "completed" | "failed";

/**
 * A row from the `reports` table.
 *
 * Declared as a `type` (not `interface`) on purpose: Supabase's `GenericTable`
 * requires `Row extends Record<string, unknown>`, and only type aliases get an
 * implicit index signature — an interface here would make the whole schema
 * resolve to `never`.
 */
export type ReportRow = {
  id: string;
  user_id: string;
  client_name: string;
  status: ReportStatus;
  source_filename: string | null;
  source_size_bytes: number | null;
  original_pdf_path: string | null;
  json_path: string | null;
  final_pdf_path: string | null;
  report_data: DietReport | null;
  error_message: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Supabase Database typing (minimal — just what this app touches).
 * Shaped to satisfy postgrest-js's `GenericSchema`/`GenericTable` constraints
 * (note the required `Relationships`, `Views` and `Functions` keys) so the
 * typed query builder resolves correctly instead of falling back to `never`.
 */
export interface Database {
  public: {
    Tables: {
      reports: {
        Row: ReportRow;
        Insert: Partial<ReportRow> & {
          user_id: string;
          client_name: string;
          status: ReportStatus;
        };
        Update: Partial<ReportRow>;
        Relationships: [];
      };
    };
    // Empty mapped types (matching Supabase codegen). Using `Record<string,
    // never>` here would add a string index signature that resolves
    // `Tables & Views` intersections to `never`.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export interface GenerateReportResponse {
  id: string;
  status: ReportStatus;
}
