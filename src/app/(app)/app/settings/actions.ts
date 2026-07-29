"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function updateNotificationPrefs(formData: FormData) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };
  const { supabase, user } = await requireUser();

  const prefs = {
    deadlines: formData.get("deadlines") === "on",
    funding: formData.get("funding") === "on",
    community: formData.get("community") === "on",
    product: formData.get("product") === "on",
  };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: prefs })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function updateCommunityNotificationPreference(enabled: boolean) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };
  const { supabase, user } = await requireUser();
  const nextEnabled = enabled === true;

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", user.id)
    .maybeSingle();
  if (readError) {
    return {
      ok: false,
      error: "We couldn't load your notification preference.",
    };
  }

  const current = profile?.notification_prefs ?? {
    deadlines: true,
    funding: true,
    community: true,
    product: true,
  };
  const { error } = await supabase
    .from("profiles")
    .update({
      notification_prefs: {
        ...current,
        community: nextEnabled,
      },
    })
    .eq("id", user.id);

  if (error)
    return {
      ok: false,
      error: "We couldn't save your notification preference.",
    };

  revalidatePath("/app/settings");
  return { ok: true };
}

/**
 * Mark all of a user's notifications as read.
 */
export async function markAllRead() {
  if (!isSupabaseConfigured) return { ok: false };
  const { supabase, user } = await requireUser();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  revalidatePath("/app/notifications");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markRead(id: string) {
  if (!isSupabaseConfigured) return { ok: false };
  const { supabase, user } = await requireUser();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/app/notifications");
  return { ok: true };
}

/**
 * Real account deletion (POPIA, doc 11). Migration 0020 installs a
 * caller-scoped RPC that removes the auth user. Cascading FKs remove owned
 * private/community data, while reports and moderation records are retained
 * without the deleted user's identity as defined by migration 0014.
 */
export async function deleteAccount(formData: FormData) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };
  const confirmText = String(formData.get("confirm") ?? "").trim();
  if (confirmText !== "DELETE") {
    return { ok: false, error: "Type DELETE to confirm." };
  }

  const { supabase } = await requireUser();

  // Calls a SECURITY DEFINER function that deletes the calling auth user.
  // ON DELETE CASCADE then removes every owned row.
  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    return {
      ok: false,
      error:
        "We couldn't delete your account. Please sign out, log in again, and retry. If the problem continues, contact Phapano support.",
    };
  }

  await supabase.auth.signOut();
  redirect("/?goodbye=1");
}
