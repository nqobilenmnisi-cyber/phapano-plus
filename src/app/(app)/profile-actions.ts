"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CareerStage, PsychologyStream } from "@/types/database";

export async function completeOnboarding(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Intended stream is optional and single; we store it in the interests array
  // (one element) so the rest of the app, which reads interests[], keeps working.
  const stream = String(formData.get("stream") ?? "").trim();
  const interests = stream ? ([stream] as PsychologyStream[]) : [];

  const stage =
    (String(formData.get("career_stage") ?? "") || null) as CareerStage | null;
  const stageOther = String(formData.get("career_stage_other") ?? "").trim();

  // UPSERT (not update) so onboarding works even if no profile row exists yet.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: String(formData.get("first_name") ?? "").trim() || null,
      surname: String(formData.get("surname") ?? "").trim() || null,
      career_stage: stage,
      career_stage_other: stage === "other" ? stageOther || null : null,
      university: String(formData.get("university") ?? "").trim() || null,
      province: String(formData.get("province") ?? "").trim() || null,
      interests,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    // Surface the problem instead of silently redirecting to a blank dashboard.
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updateProfile(formData: FormData) {
  if (!isSupabaseConfigured) return { error: "Supabase isn't connected yet." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const interests = formData.getAll("interests").map(String) as PsychologyStream[];
  const stage = (String(formData.get("career_stage") ?? "") || null) as CareerStage | null;
  const stageOther = String(formData.get("career_stage_other") ?? "").trim();

  // UPSERT so editing works even if the row was never created.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: String(formData.get("full_name") ?? "").trim() || null,
      surname: String(formData.get("surname") ?? "").trim() || null,
      career_stage: stage,
      career_stage_other: stage === "other" ? stageOther || null : null,
      university: String(formData.get("university") ?? "").trim() || null,
      province: String(formData.get("province") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      research_interests:
        String(formData.get("research_interests") ?? "").trim() || null,
      application_year:
        String(formData.get("application_year") ?? "").trim() || null,
      goals: String(formData.get("goals") ?? "").trim() || null,
      skills: String(formData.get("skills") ?? "").trim() || null,
      volunteering: String(formData.get("volunteering") ?? "").trim() || null,
      workshops: String(formData.get("workshops") ?? "").trim() || null,
      linkedin_url: String(formData.get("linkedin_url") ?? "").trim() || null,
      website_url: String(formData.get("website_url") ?? "").trim() || null,
      scholar_url: String(formData.get("scholar_url") ?? "").trim() || null,
      researchgate_url:
        String(formData.get("researchgate_url") ?? "").trim() || null,
      orcid: String(formData.get("orcid") ?? "").trim() || null,
      interests,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/app/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Saves just the avatar URL (after a client-side upload to Supabase Storage). */
export async function saveAvatarUrl(url: string) {
  if (!isSupabaseConfigured) return { error: "Supabase isn't connected yet." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email ?? null, avatar_url: url, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) return { error: error.message };
  revalidatePath("/app/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
