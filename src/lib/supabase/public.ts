import { createClient } from "@supabase/supabase-js";
import {
  SAFE_SUPABASE_ANON_KEY,
  SAFE_SUPABASE_URL,
} from "@/lib/supabase/config";
import type { Database } from "@/types/database";

/**
 * Cookie-free client for published catalogue data.
 *
 * Keeping public directory reads separate from the authenticated SSR client
 * lets Next cache the same safe result for every member instead of repeating
 * an identical Ireland database request on every navigation.
 */
export function createPublicClient() {
  return createClient<Database>(SAFE_SUPABASE_URL, SAFE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
