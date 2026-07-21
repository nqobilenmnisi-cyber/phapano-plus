"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAuthCallbackUrl } from "@/lib/site-url";
import { TERMS_VERSION } from "@/lib/legal";

export type AuthResult =
  | { error: string }
  | { ok: true; pendingVerification: true; email: string }
  | undefined;

export type ResendResult = { ok: true } | { error: string };

/**
 * Translate raw Supabase errors into calm, human copy.
 * Raw technical messages must never reach the interface.
 */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "That email and password combination doesn't match our records. Please try again.";
  if (m.includes("email not confirmed"))
    return "Please verify your email first — check your inbox for the link from Phapano+.";
  if (m.includes("for security purposes") || m.includes("rate limit"))
    return "Please wait a moment before requesting another email.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try logging in instead.";
  if (m.includes("already confirmed"))
    return "This email is already verified — you can log in.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "That doesn't look like a valid email address.";
  return "Something went wrong on our side. Please try again in a moment.";
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Supabase isn't connected yet. Add your credentials to .env.local to enable sign up.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8)
    return { error: "Please use a password of at least 8 characters." };
  if (formData.get("accept_terms") !== "on")
    return {
      error: "Please accept the Terms of Use and Privacy Policy to create an account.",
    };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Environment-aware: production links always land on plus.phapano.com,
      // never localhost. See src/lib/site-url.ts.
      emailRedirectTo: getAuthCallbackUrl(),
      // Authoritative record of legal acceptance: stored in auth user
      // metadata so it exists even before the profile row is used.
      data: {
        accepted_terms_version: TERMS_VERSION,
        accepted_terms_at: new Date().toISOString(),
      },
    },
  });

  if (error) return { error: friendlyAuthError(error.message) };

  // With email confirmation ON, no session is returned until the user clicks
  // the link in their email. Show a calm "check your email" screen.
  if (!data.session) {
    return { ok: true, pendingVerification: true, email };
  }

  // If confirmation is OFF (session returned immediately), go straight into
  // onboarding — they're a brand-new user.
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Supabase isn't connected yet. Add your credentials to .env.local to enable login.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestedRedirect = String(formData.get("redirect") ?? "/dashboard");

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: friendlyAuthError(error.message) };

  // First-login detection: if this user hasn't finished onboarding, send them
  // there before anything else. We read the profile the signup trigger created.
  let destination = requestedRedirect || "/dashboard";
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", data.user.id)
      .single();

    if (!profile?.onboarding_complete) {
      destination = "/onboarding";
    }
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

/**
 * Re-send the signup verification email. Used from the "check your email"
 * screen and the expired-link page. Never leaks raw Supabase errors, and
 * always uses the environment-aware callback URL.
 */
export async function resendVerification(email: string): Promise<ResendResult> {
  if (!isSupabaseConfigured) {
    return { error: "Email sending isn't available right now." };
  }

  const target = email.trim();
  if (!target || !target.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: target,
    options: { emailRedirectTo: getAuthCallbackUrl() },
  });

  if (error) return { error: friendlyAuthError(error.message) };
  return { ok: true };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}


export async function requestPasswordReset(
  formData: FormData
): Promise<AuthResult> {
  if (!isSupabaseConfigured)
    return { error: "Supabase isn't connected yet." };
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Please enter your email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAuthCallbackUrl()}?next=/auth/reset`,
  });
  if (error) return { error: friendlyAuthError(error.message) };
  // Same response whether or not the account exists — no account enumeration.
  return { ok: true, pendingVerification: true, email };
}

export async function updatePassword(
  formData: FormData
): Promise<AuthResult> {
  if (!isSupabaseConfigured)
    return { error: "Supabase isn't connected yet." };
  const password = String(formData.get("password") ?? "");
  if (password.length < 8)
    return { error: "Please use a password of at least 8 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error:
        "This reset link has expired. Please request a new one from the login page.",
    };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendlyAuthError(error.message) };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
