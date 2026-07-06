import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { serverEnv } from "@/lib/env";

/**
 * Service-role client — bypasses RLS. SERVER ONLY.
 *
 * Used inside authenticated API routes to write Storage objects and DB rows on
 * behalf of the already-verified user. We always scope writes to the verified
 * `user.id`, so bypassing RLS here is safe and intentional.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    serverEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
