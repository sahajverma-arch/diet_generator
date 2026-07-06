"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReport } from "@/lib/reports";
import { removeReportObjects, createSignedUrl } from "@/lib/storage";
import { errorMessage } from "@/lib/utils";

/** Delete a report row and its storage artifacts. Verifies ownership first. */
export async function deleteReport(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Ownership check via RLS-scoped read.
  const report = await getReport(id);
  if (!report) return { error: "Report not found." };

  try {
    await removeReportObjects(user.id, id).catch(() => {});
    const admin = createAdminClient();
    const { error } = await admin
      .from("reports")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return {};
}

/** Signed URL to the *original* uploaded PDF (10-minute expiry). */
export async function getOriginalPdfUrl(
  id: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // RLS-scoped read (returns null if the report isn't the caller's).
  const report = await getReport(id);
  if (!report?.original_pdf_path) return { error: "Original file not available." };

  try {
    const url = await createSignedUrl(report.original_pdf_path);
    return { url };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
