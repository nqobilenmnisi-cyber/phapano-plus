import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * /auth/callback — the landing point for Supabase email verification links.
 *
 * Handles both link styles Supabase can produce:
 *   1. token_hash + type  (recommended email template, works across browsers)
 *   2. code               (PKCE flow, same-browser only)
 *
 * Routing outcomes:
 *   - Verification succeeds            → /auth/verified
 *   - Link used but session exists     → /auth/verified?status=already
 *   - Link invalid, expired or missing → /auth/error
 *
 * We never render UI here; this route only establishes the session (when
 * possible) and hands off to a dedicated, human-friendly state page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const errorCode = searchParams.get("error_code");

  const to = (path: string) => NextResponse.redirect(`${origin}${path}`);

  if (!isSupabaseConfigured) {
    return to("/login");
  }

  const supabase = await createClient();

  // Supabase sometimes redirects errors (e.g. expired links) straight back
  // to us as query params.
  if (errorCode) {
    return to(await errorOrAlready(supabase));
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return to("/auth/verified");
    return to(await errorOrAlready(supabase));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return to("/auth/verified");
    return to(await errorOrAlready(supabase));
  }

  // No recognisable parameters — treat as an unavailable link.
  return to("/auth/error");
}

/**
 * A failed exchange usually means the link expired or was already used.
 * If the visitor already has a valid session with a confirmed email, the
 * honest answer is "you're already verified" — not an error.
 */
async function errorOrAlready(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) return "/auth/verified?status=already";
  return "/auth/error";
}
