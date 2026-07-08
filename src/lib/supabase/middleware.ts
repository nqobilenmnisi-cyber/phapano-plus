import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SAFE_SUPABASE_URL,
  SAFE_SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from "./config";
import type { Database } from "@/types/database";

/**
 * Refreshes the auth session and enforces route protection.
 *
 * Protected prefixes: /dashboard, /app, /onboarding, /admin.
 * Unauthenticated users hitting these are redirected to /login.
 *
 * In placeholder mode (no real Supabase) we DO NOT redirect — this lets the
 * public website and the app shell be developed/previewed without real auth.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Without real credentials, skip auth gating so development can proceed.
  if (!isSupabaseConfigured) {
    return supabaseResponse;
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
