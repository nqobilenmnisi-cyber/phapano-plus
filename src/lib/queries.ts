import { createClient } from "@/lib/supabase/server";
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
} from "@/types/database";

/**
 * Central data-access layer. Every function degrades gracefully in
 * placeholder mode (returns null/empty) so the UI can render demo states.
 */

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Lightweight auth snapshot for public/marketing pages and the site header,
 * so they can show "Open Phapano+" to signed-in users instead of "Join".
 */
export async function getAuthState(): Promise<{
  authed: boolean;
  onboarded: boolean;
}> {
  if (!isSupabaseConfigured) return { authed: false, onboarded: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authed: false, onboarded: false };
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();
  return { authed: true, onboarded: !!data?.onboarding_complete };
}

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
}

export async function getSavedFunding(): Promise<FundingOpportunity[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("saved_funding")
    .select("funding:funding_opportunities(*)")
    .eq("user_id", user.id);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Notes that have a due date, for the dashboard radar / next steps. */
export async function getDatedNotes(): Promise<JournalEntry[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });
  return data ?? [];
}

export async function getNotifications(): Promise<Notification[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

/** Saved ID sets, for quick "is this saved?" checks in lists. */
export async function getSavedIdSets() {
  if (!isSupabaseConfigured) return { fundingIds: new Set<string>() };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const { data } = await supabase
    .from("programmes")
    .select("*")
    .order("institution", { ascending: true });
  return (data as ApplyProgramme[] | null) ?? [];
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("saved_programmes")
    .select("*, programme:programmes(*)")
    .eq("user_id", user.id);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
