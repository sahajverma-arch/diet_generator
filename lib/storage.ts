import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

/**
 * Storage layout inside the private bucket:
 *   {userId}/{reportId}/original.pdf   — the uploaded diet PDF
 *   {userId}/{reportId}/report.json    — the structured GPT output
 *   {userId}/{reportId}/report.pdf     — the generated LEANR report
 */
export const storagePaths = {
  original: (userId: string, reportId: string) =>
    `${userId}/${reportId}/original.pdf`,
  json: (userId: string, reportId: string) =>
    `${userId}/${reportId}/report.json`,
  final: (userId: string, reportId: string) =>
    `${userId}/${reportId}/report.pdf`,
};

interface UploadArgs {
  path: string;
  body: Buffer | string;
  contentType: string;
}

export async function uploadObject({ path, body, contentType }: UploadArgs) {
  const admin = createAdminClient();
  const bytes = typeof body === "string" ? Buffer.from(body, "utf-8") : body;

  const { error } = await admin.storage
    .from(serverEnv.storageBucket)
    .upload(path, bytes, { contentType, upsert: true });

  if (error) {
    throw new Error(`Storage upload failed (${path}): ${error.message}`);
  }
  return path;
}

/** Create a short-lived signed URL for a private object. */
export async function createSignedUrl(path: string, expiresInSeconds = 60 * 10) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(serverEnv.storageBucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Could not sign URL for ${path}: ${error?.message}`);
  }
  return data.signedUrl;
}

export async function downloadObject(path: string): Promise<Buffer> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(serverEnv.storageBucket)
    .download(path);

  if (error || !data) {
    throw new Error(`Could not download ${path}: ${error?.message}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

/** Best-effort cleanup used when generation fails midway. */
export async function removeReportObjects(userId: string, reportId: string) {
  const admin = createAdminClient();
  await admin.storage
    .from(serverEnv.storageBucket)
    .remove([
      storagePaths.original(userId, reportId),
      storagePaths.json(userId, reportId),
      storagePaths.final(userId, reportId),
    ]);
}
