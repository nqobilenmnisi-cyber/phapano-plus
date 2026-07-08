/**
 * Centralised Supabase configuration.
 *
 * The app is designed to run with placeholder credentials so development can
 * proceed before real Supabase keys exist. `isSupabaseConfigured` lets the UI
 * show a calm "demo mode" state instead of throwing when keys are absent.
 *
 * When you add real credentials to .env.local, nothing else needs to change.
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "placeholder";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "placeholder";

/** True only when real (non-placeholder) credentials are present. */
export const isSupabaseConfigured =
  SUPABASE_URL !== "placeholder" &&
  SUPABASE_ANON_KEY !== "placeholder" &&
  SUPABASE_URL.startsWith("http");

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
