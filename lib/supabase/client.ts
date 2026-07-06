"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";
import { publicEnv } from "@/lib/env";

/** Supabase client for use in Client Components. */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
}
