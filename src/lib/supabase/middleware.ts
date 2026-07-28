import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SAFE_SUPABASE_URL,
  SAFE_SUPABASE_ANON_KEY,
  isDemoMode,
  isSupabaseConfigured,
} from "./config";
import type { Database } from "@/types/database";

/**
 * Refreshes the auth session and enforces route protection.
 *
 * Protected prefixes: /dashboard, /app, /onboarding, /admin.
 * Unauthenticated users hitting these are redirected to /login.
 *
 * Missing production configuration fails closed. Auth-free demo behaviour is
 * available only through an explicit development-only flag.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured) {
    if (isDemoMode) return supabaseResponse;
    return new NextResponse(
      "Phapano+ is temporarily unavailable because required service configuration is missing.",
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    );
  }

  const supabase = createServerClient<Database>(
    SAFE_SUPABASE_URL,
    SAFE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const protectedPrefixes = ["/dashboard", "/app", "/onboarding", "/admin"];
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't see auth pages.
  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
