import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  Profile,
  FundingOpportunity,
  ApplyProgramme,
  ProgrammeSource,
  SavedProgrammeWithPlan,
  ApplicationPlan,
  JournalEntry,
  Notification,
  PsychologyUniversityCatalogue,
} from "@/types/database";

/**
 * Central data-access layer. Every function degrades gracefully in
 * placeholder mode (returns null/empty) so the UI can render demo states.
 */

export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Lightweight auth snapshot for public/marketing pages and the site header,
 * so they can show "Open Phapano+" to signed-in users instead of "Join".
 */
export const getAuthState = cache(async (): Promise<{
  authed: boolean;
  onboarded: boolean;
}> => {
  if (!isSupabaseConfigured) return { authed: false, onboarded: false };
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { authed: false, onboarded: false };
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();
  return { authed: true, onboarded: !!data?.onboarding_complete };
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // maybeSingle() returns null (not an error) when no row exists yet.
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  // No profile row yet — create a minimal one tied to the auth user so the
  // app never shows a "signed out" state for an authenticated user.
  const { data: created } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ?? null,
      },
      { onConflict: "id" }
    )
    .select("*")
    .maybeSingle();

  return created ?? null;
});

export async function getSavedFunding(): Promise<FundingOpportunity[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("saved_funding")
    .select("funding:funding_opportunities!inner(*)")
    .eq("user_id", user.id)
    .eq("funding.is_published", true);
  if (error) throw new Error(`Unable to load saved funding: ${error.message}`);
  return (data ?? []).map((r: { funding: FundingOpportunity }) => r.funding).filter(Boolean);
}

export async function getFunding(): Promise<FundingOpportunity[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("funding_opportunities")
    .select("*")
    .eq("is_published", true)
    .order("closing_date", { ascending: true });
  return data ?? [];
}

export async function getFundingOne(
  id: string
): Promise<FundingOpportunity | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("funding_opportunities")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Notes that have a due date, for My Pathway and dashboard next steps. */
export async function getDatedNotes(): Promise<JournalEntry[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });
  return data ?? [];
}

export const getNotifications = cache(async (): Promise<Notification[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  // This caller-scoped RPC creates any due deadline or newly relevant funding
  // alerts that the member enabled. Stable keys prevent duplicate reminders.
  await supabase.rpc("refresh_pathway_notifications");
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
});

/**
 * App chrome only needs the unread badge. Keep this deliberately read-only and
 * cheap so ordinary navigation never waits for notification generation.
 */
export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  if (!isSupabaseConfigured) return 0;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);
  return count ?? 0;
});

/** Saved ID sets, for quick "is this saved?" checks in lists. */
export async function getSavedIdSets() {
  if (!isSupabaseConfigured) return { fundingIds: new Set<string>() };
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { fundingIds: new Set<string>() };

  const { data: f } = await supabase
    .from("saved_funding")
    .select("funding_id")
    .eq("user_id", user.id);
  return {
    fundingIds: new Set((f ?? []).map((r) => r.funding_id)),
  };
}

// ---- Apply directory: programmes + saved_programmes ---------------------

/** All programmes in the directory (public read). Ordered for stable display. */
export async function getProgrammes(): Promise<ApplyProgramme[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programmes")
    .select("*")
    .eq("is_published", true)
    .eq("verification_status", "verified")
    .order("institution", { ascending: true })
    .order("qualification", { ascending: true });
  if (error) throw new Error(`Unable to load Apply programmes: ${error.message}`);
  return (data as ApplyProgramme[] | null) ?? [];
}

/**
 * National Psychology pathway audit: exactly one row per SA public university.
 * The migration and UI distinguish a verified offering from an unverified one.
 */
export async function getPsychologyUniversityCatalogue(): Promise<
  PsychologyUniversityCatalogue[]
> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("psychology_university_catalogue")
    .select("*")
    .eq("is_published", true)
    .order("institution", { ascending: true });
  return (data as PsychologyUniversityCatalogue[] | null) ?? [];
}

/** A single programme by id. */
export async function getProgramme(id: string): Promise<ApplyProgramme | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("programmes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as ApplyProgramme | null) ?? null;
}

/** IDs of programmes the current user has saved (for save-state on cards). */
export async function getSavedProgrammeIds(): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from("saved_programmes")
    .select("programme_id")
    .eq("user_id", user.id)
    .eq("is_saved", true);
  return (data ?? []).map((r: { programme_id: string }) => r.programme_id);
}

/** Full saved programmes for the current user, with their personal tracker. */
export async function getSavedProgrammes(): Promise<SavedProgrammeWithPlan[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("saved_programmes")
    .select("*, programme:programmes!inner(*)")
    .eq("user_id", user.id)
    .eq("programme.is_published", true)
    .eq("programme.verification_status", "verified")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Unable to load saved programmes: ${error.message}`);
  return (
    (data ?? []).filter(
      (r: { programme: ApplyProgramme | null }) => r.programme
    ) as unknown as SavedProgrammeWithPlan[]
  );
}

/** The current user's saved row + tracker for one programme (or null). */
export async function getSavedProgramme(
  programmeId: string
): Promise<ApplicationPlan | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from("saved_programmes")
    .select(
      "is_saved, status, next_action, my_deadline, my_fee, documents_uploaded, referees_requested, personal_statement_done, cv_done, transcript_uploaded, fee_paid, submitted, interview_received, selection_completed, outcome_received, custom_steps, notes"
    )
    .eq("user_id", user.id)
    .eq("programme_id", programmeId)
    .maybeSingle();
  return (data as ApplicationPlan | null) ?? null;
}

/** Official source URLs for a programme (for the detail page freshness panel). */
export async function getProgrammeSources(
  programmeId: string
): Promise<ProgrammeSource[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("programme_sources")
    .select("*")
    .eq("programme_id", programmeId)
    .order("is_primary", { ascending: false });
  return (data as ProgrammeSource[] | null) ?? [];
}
