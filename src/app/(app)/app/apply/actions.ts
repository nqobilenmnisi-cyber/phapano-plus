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

/**
 * Save or unsave a programme from the Apply directory without deleting the
 * user's application plan. Owner-scoped by RLS.
 */
export async function toggleSaveProgramme(programmeId: string, saved: boolean) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };
  const { supabase, user } = await requireUser();

  if (saved) {
    const { error } = await supabase
      .from("saved_programmes")
      .update({ is_saved: false, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("programme_id", programmeId);
    if (error) {
      console.error("Unable to unsave programme", error);
      return {
        ok: false,
        error: "We couldn't update this saved programme. Please try again.",
      };
    }
  } else {
    const { error } = await supabase
      .from("saved_programmes")
      .upsert(
        {
          user_id: user.id,
          programme_id: programmeId,
          is_saved: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,programme_id" }
      );
    if (error) {
      console.error("Unable to save programme", error);
      return {
        ok: false,
        error: "We couldn't save this programme. Please try again.",
      };
    }
  }
  revalidatePath("/app/apply");
  revalidatePath(`/app/apply/programme/${programmeId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Save a private programme note directly from the unified Apply list. */
export async function updateProgrammeNote(programmeId: string, notes: string | null) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("saved_programmes").upsert(
    {
      user_id: user.id,
      programme_id: programmeId,
      is_saved: true,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,programme_id" }
  );

  if (error) {
    console.error("Unable to update programme note", error);
    return {
      ok: false,
      error: "We couldn't save this note. Please try again.",
    };
  }

  revalidatePath("/app/apply");
  revalidatePath(`/app/apply/programme/${programmeId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Save or update the user's personal application tracker for a programme.
 * Upserts the saved_programmes row. A new plan starts saved, while editing an
 * existing unsaved plan preserves its bookmark state. Owner-scoped by RLS.
 * Personal data only — never public.
 */
export async function updateApplicationPlan(
  programmeId: string,
  plan: {
    status: string | null;
    next_action: string | null;
    my_deadline: string | null;
    my_fee: string | null;
    documents_uploaded: boolean;
    referees_requested: boolean;
    personal_statement_done: boolean;
    cv_done: boolean;
    transcript_uploaded: boolean;
    fee_paid: boolean;
    submitted: boolean;
    interview_received: boolean;
    selection_completed: boolean;
    outcome_received: boolean;
    custom_steps: { id: string; title: string; done: boolean }[];
    notes: string | null;
  }
) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("saved_programmes").upsert(
    {
      user_id: user.id,
      programme_id: programmeId,
      status: plan.status || null,
      next_action: plan.next_action || null,
      my_deadline: plan.my_deadline || null,
      my_fee: plan.my_fee || null,
      documents_uploaded: plan.documents_uploaded,
      referees_requested: plan.referees_requested,
      personal_statement_done: plan.personal_statement_done,
      cv_done: plan.cv_done,
      transcript_uploaded: plan.transcript_uploaded,
      fee_paid: plan.fee_paid,
      submitted: plan.submitted,
      interview_received: plan.interview_received,
      selection_completed: plan.selection_completed,
      outcome_received: plan.outcome_received,
      custom_steps: plan.custom_steps,
      notes: plan.notes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,programme_id" }
  );

  if (error) {
    console.error("Unable to update application plan", error);
    return {
      ok: false,
      error: "We couldn't save your application plan. Please try again.",
    };
  }
  revalidatePath("/app/apply");
  revalidatePath(`/app/apply/programme/${programmeId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
