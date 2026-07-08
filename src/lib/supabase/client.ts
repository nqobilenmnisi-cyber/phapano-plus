"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  SAFE_SUPABASE_URL,
  SAFE_SUPABASE_ANON_KEY,
} from "./config";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client for use inside Client Components.
 * Safe to call in placeholder mode — it constructs but auth calls will
 * fail gracefully, which the UI handles via isSupabaseConfigured.
 */
export function createClient() {
  return createBrowserClient<Database>(
    SAFE_SUPABASE_URL,
    SAFE_SUPABASE_ANON_KEY
  );
}
