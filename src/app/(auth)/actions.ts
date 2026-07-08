"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthResult =
  | { error: string }
  | { ok: true; pendingVerification: true; email: string }
  | undefined;

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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };

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

  if (error) return { error: error.message };

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

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
