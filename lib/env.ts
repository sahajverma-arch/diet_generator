/**
 * Centralised, validated access to environment variables.
 *
 * Import `serverEnv` only from server-side code (API routes, server actions,
 * server components). `publicEnv` is safe to use anywhere.
 *
 * We validate lazily so that a missing variable throws a clear error the first
 * time it is actually used, rather than a cryptic `undefined` deep in a call.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const serverEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get storageBucket() {
    return process.env.SUPABASE_STORAGE_BUCKET || "diet-reports";
  },
  get openaiApiKey() {
    return required("OPENAI_API_KEY", process.env.OPENAI_API_KEY);
  },
  get openaiModel() {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  },
  /**
   * Optional base URL for any OpenAI-compatible provider.
   * e.g. NVIDIA: https://integrate.api.nvidia.com/v1
   * Leave unset to use OpenAI directly.
   */
  get openaiBaseUrl(): string | undefined {
    return process.env.OPENAI_BASE_URL || undefined;
  },
};
