/**
 * Centralised Supabase configuration.
 *
 * Missing credentials fail closed unless an explicit development-only demo
 * flag is enabled. Production must never relax authentication because an
 * environment variable is absent.
 */

import {
  hasSupabaseConfiguration,
  isExplicitDevelopmentDemo,
} from "@/lib/runtime-config";

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const configuredKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_URL = configuredUrl ?? "placeholder";

export const SUPABASE_ANON_KEY = configuredKey ?? "placeholder";

/** True only when real (non-placeholder) credentials are present. */
export const isSupabaseConfigured = hasSupabaseConfiguration({
  supabaseUrl: configuredUrl,
  supabaseKey: configuredKey,
});

/** Demo mode must be deliberately enabled and cannot run in production. */
export const isDemoMode = isExplicitDevelopmentDemo({
  nodeEnv: process.env.NODE_ENV,
  demoFlag: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE,
});

/**
 * A safe URL to hand to the Supabase client even in placeholder mode.
 * Using a syntactically-valid URL avoids the client constructor throwing.
 */
export const SAFE_SUPABASE_URL = isSupabaseConfigured
  ? SUPABASE_URL
  : "https://placeholder.supabase.co";

export const SAFE_SUPABASE_ANON_KEY = isSupabaseConfigured
  ? SUPABASE_ANON_KEY
  : "placeholder-anon-key";
