/**
 * Environment-aware base URL for the app.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL — explicit override, set this in Vercel to
 *      https://plus.phapano.com for production.
 *   2. Vercel preview deployments — the auto-generated preview URL, so auth
 *      links work on previews too.
 *   3. Production builds — the canonical Phapano+ domain. Production NEVER
 *      falls back to localhost.
 *   4. Local development only — localhost.
 *
 * Server-side only for VERCEL_* vars; safe to import anywhere.
 */

const PRODUCTION_URL = "https://plus.phapano.com";

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === "production") return PRODUCTION_URL;

  return "http://localhost:3000";
}

/** The full callback URL Supabase should send verification links to. */
export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
