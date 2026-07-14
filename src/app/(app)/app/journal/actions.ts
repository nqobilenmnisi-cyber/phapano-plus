"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { JournalEntry } from "@/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createEntry(formData: FormData) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };
  const { supabase, user } = await requireUser();

  const content = String(formData.get("content") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim() || null;
  // "approach" is the (optional) tag, stored as free text so custom "Other"
  // tags work and no enum can reject a value.
  const approach = String(formData.get("approach") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "").trim() || null;
  const due_date = String(formData.get("due_date") ?? "").trim() || null;

  if (!content) return { ok: false, error: "Write a little something first." };

  const { error } = await supabase.from("journal_entries").insert({
    user_id: user.id,
    content,
    prompt,
    approach,
    priority,
    due_date,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/journal");
  return { ok: true };
}

export async function updateEntry(formData: FormData) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!id || !content) return { ok: false };

  // Only set fields that were provided, so a simple content edit still works.
  const patch: Partial<JournalEntry> = { content };
  if (formData.has("approach"))
    patch.approach = String(formData.get("approach") ?? "").trim() || null;
  if (formData.has("priority"))
    patch.priority = String(formData.get("priority") ?? "").trim() || null;
  if (formData.has("due_date"))
    patch.due_date = String(formData.get("due_date") ?? "").trim() || null;

  const { error } = await supabase
    .from("journal_entries")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/journal");
  return { ok: true };
}

export async function deleteEntry(id: string) {
  if (!isSupabaseConfigured) return { ok: false };
  const { supabase, user } = await requireUser();
  await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/app/journal");
  return { ok: true };
}
