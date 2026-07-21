"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type {
  CommunityModerationActionType,
  CommunityModerationState,
  CommunityReport,
} from "@/types/database";

export type AdminActionResult = { ok: true } | { error: string };

const FAIL = "The action didn't complete. Please try again.";

function revalidate() {
  revalidatePath("/admin/community");
  revalidatePath("/app/community", "layout");
}

async function logAction(input: {
  reportId?: string | null;
  targetUserId?: string | null;
  action: CommunityModerationActionType;
  notes?: string | null;
}): Promise<void> {
  const ctx = await requireAdmin();
  if (ctx.demo) return;
  await ctx.supabase.from("community_moderation_actions").insert({
    report_id: input.reportId ?? null,
    target_user_id: input.targetUserId ?? null,
    admin_id: ctx.user.id,
    action: input.action,
    notes: input.notes ?? null,
  });
}

/** Close a report as dismissed or resolved, with optional notes. */
export async function closeReport(
  reportId: string,
  resolution: "dismissed" | "resolved",
  notes: string,
  actionTaken: string
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if (ctx.demo) return { error: "Not available in demo mode." };
  const { error } = await ctx.supabase
    .from("community_reports")
    .update({
      status: resolution,
      moderator_notes: notes.trim() || null,
      action_taken: actionTaken.trim() || null,
      resolved_by: ctx.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) return { error: FAIL };
  await logAction({
    reportId,
    action: resolution === "dismissed" ? "dismiss" : "resolve",
    notes,
  });
  revalidate();
  return { ok: true };
}

/** Remove or restore the content a report points at (soft moderation). */
export async function setContentStatus(
  report: Pick<
    CommunityReport,
    "id" | "target_type" | "target_post_id" | "target_comment_id" | "target_user_id"
  >,
  removed: boolean
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if (ctx.demo) return { error: "Not available in demo mode." };

  const status = removed ? "removed" : "published";
  if (report.target_type === "post" && report.target_post_id) {
    const { error } = await ctx.supabase
      .from("community_posts")
      .update({ status })
      .eq("id", report.target_post_id);
    if (error) return { error: FAIL };
  } else if (report.target_type === "comment" && report.target_comment_id) {
    const { error } = await ctx.supabase
      .from("community_comments")
      .update({ status })
      .eq("id", report.target_comment_id);
    if (error) return { error: FAIL };
  } else {
    return { error: "This report doesn't point at removable content." };
  }

  await logAction({
    reportId: report.id,
    targetUserId: report.target_user_id,
    action: removed ? "remove_content" : "restore_content",
  });
  revalidate();
  return { ok: true };
}

/** Record an internal warning against the reported account. */
export async function warnUser(
  reportId: string,
  targetUserId: string,
  notes: string
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if (ctx.demo) return { error: "Not available in demo mode." };
  if (!notes.trim())
    return { error: "Add a short note describing the warning." };
  await logAction({ reportId, targetUserId, action: "warn", notes });
  revalidate();
  return { ok: true };
}

/** Toggle posting restriction or community suspension for an account. */
export async function setModerationFlag(
  reportId: string | null,
  targetUserId: string,
  flag: "posting_restricted" | "community_suspended",
  value: boolean
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if (ctx.demo) return { error: "Not available in demo mode." };

  const payload: Partial<CommunityModerationState> & { user_id: string } = {
    user_id: targetUserId,
    updated_at: new Date().toISOString(),
  };
  if (flag === "posting_restricted") payload.posting_restricted = value;
  else payload.community_suspended = value;
  const { error } = await ctx.supabase
    .from("community_moderation_state")
    .upsert(payload, { onConflict: "user_id" });
  if (error) return { error: FAIL };

  const action: CommunityModerationActionType =
    flag === "posting_restricted"
      ? value
        ? "restrict_posting"
        : "unrestrict_posting"
      : value
        ? "suspend_community"
        : "unsuspend_community";
  await logAction({ reportId, targetUserId, action });
  revalidate();
  return { ok: true };
}
