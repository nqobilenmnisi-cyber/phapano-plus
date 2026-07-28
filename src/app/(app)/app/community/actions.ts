"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  normalizeCommunityProfileText,
  validateCommunityProfileText,
} from "@/lib/community-profile-fields";
import {
  CONNECTION_NOTE_MAX_LENGTH,
  isUuid,
  normalizeConnectionNote,
} from "@/lib/community-connections";
import {
  callRpc,
  COMMENT_MAX_LENGTH,
  COMMUNITY_TERMS_TYPE,
  COMMUNITY_TERMS_VERSION,
  getMyUserId,
  POST_MAX_LENGTH,
  searchMembers,
  type MemberSearchParams,
} from "@/lib/community";
import type {
  CareerStage,
  CommunityConnectionPermission,
  CommunityMemberCard,
  CommunityReportCategory,
  CommunityReportTargetType,
  CommunityVisibility,
  PsychologyStream,
} from "@/types/database";

const CAREER_STAGES = [
  "high_school","undergraduate","honours_applicant","honours","masters_applicant",
  "masters_student","intern","community_service","professional","other",
] as const;
const PSYCH_STREAMS = [
  "clinical","counselling","research","educational","industrial_organisational",
  "neuropsychology","other",
] as const;

export type ActionResult = { ok: true } | { error: string };

const GENERIC_ERROR =
  "Something went wrong on our side. Please try again in a moment.";

const VISIBILITIES: CommunityVisibility[] = ["visible", "limited", "hidden"];
const CONNECTION_PERMISSIONS: CommunityConnectionPermission[] = [
  "everyone",
  "following",
  "nobody",
];
const REPORT_CATEGORIES: CommunityReportCategory[] = [
  "harassment",
  "misinformation",
  "scam",
  "hate",
  "sexual_content",
  "privacy",
  "impersonation",
  "spam",
  "professional_misconduct",
  "other",
];

async function requireUser(): Promise<
  { uid: string } | { error: string }
> {
  if (!isSupabaseConfigured)
    return { error: "Community isn't available in demo mode." };
  const uid = await getMyUserId();
  if (!uid) return { error: "Please log in to use the community." };
  return { uid };
}

/**
 * Lightweight abuse protection for the beta: per-account sliding-window
 * caps enforced server-side with cheap indexed count queries. RLS remains
 * the security boundary; these caps only slow high-volume abuse.
 * (IP-level/edge rate limiting is deliberately deferred — see audit notes.)
 */
async function withinLimit(
  table:
    | "community_posts"
    | "community_comments"
    | "community_follows"
    | "community_connections"
    | "community_blocks"
    | "community_reports",
  column: string,
  uid: string,
  windowMs: number,
  max: number
): Promise<boolean> {
  const supabase = await createClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, uid)
    .gte("created_at", since);
  return (count ?? 0) < max;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function revalidateCommunity() {
  revalidatePath("/app/community", "layout");
}

/* ─── Community profile ─────────────────────────────────────────────── */

export async function saveCommunityProfile(
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;

  const display_name = String(formData.get("display_name") ?? "").trim();
  const stageRaw = String(formData.get("stage") ?? "");
  const streamRaw = String(formData.get("stream") ?? "");
  const profileTextInput = {
    headline: String(formData.get("headline") ?? ""),
    stage: stageRaw,
    stageOther: String(formData.get("stage_other") ?? ""),
    stream: streamRaw,
    streamOther: String(formData.get("stream_other") ?? ""),
    institution: String(formData.get("institution") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  };
  const profileText = normalizeCommunityProfileText(profileTextInput);
  const stage = (CAREER_STAGES as readonly string[]).includes(stageRaw)
    ? (stageRaw as CareerStage)
    : null;
  const stream = (PSYCH_STREAMS as readonly string[]).includes(streamRaw)
    ? (streamRaw as PsychologyStream)
    : null;
  const visibility = String(
    formData.get("visibility") ?? "visible"
  ) as CommunityVisibility;
  const connection_permission = String(
    formData.get("connection_permission") ?? "everyone"
  ) as CommunityConnectionPermission;
  const interests = String(formData.get("interests") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (display_name.length < 2 || display_name.length > 60)
    return { error: "Please choose a display name of 2–60 characters." };
  const profileTextError = validateCommunityProfileText(profileTextInput);
  if (profileTextError) return { error: profileTextError };
  if (!VISIBILITIES.includes(visibility))
    return { error: "Please choose a valid visibility option." };
  if (!CONNECTION_PERMISSIONS.includes(connection_permission))
    return { error: "Please choose who may send you connection requests." };

  const supabase = await createClient();

  // Reuse the existing safe avatar from the Phapano Passport, if any.
  const { data: passport } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", auth.uid)
    .maybeSingle();

  const { error } = await supabase.from("community_profiles").upsert(
    {
      user_id: auth.uid,
      display_name,
      headline: profileText.headline,
      stage,
      stage_other: profileText.stageOther,
      stream,
      stream_other: profileText.streamOther,
      institution: profileText.institution,
      bio: profileText.bio,
      interests,
      visibility,
      connection_permission,
      avatar_url: passport?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function acceptGuidelines(): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const supabase = await createClient();
  const { error } = await supabase.from("community_terms_acceptances").upsert(
    {
      user_id: auth.uid,
      document_type: COMMUNITY_TERMS_TYPE,
      document_version: COMMUNITY_TERMS_VERSION,
    },
    { onConflict: "user_id,document_type,document_version", ignoreDuplicates: true }
  );
  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  return { ok: true };
}

/* ─── Posts ─────────────────────────────────────────────────────────── */

export async function createPost(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something before posting." };
  if (body.length > POST_MAX_LENGTH)
    return { error: `Posts can be up to ${POST_MAX_LENGTH} characters.` };

  if (!(await withinLimit("community_posts", "author_id", auth.uid, HOUR, 10)))
    return {
      error:
        "You've posted quite a lot in the past hour. Take a short break and try again soon.",
    };

  const supabase = await createClient();

  // Official Phapano posts are those written by admins.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.uid)
    .maybeSingle();

  const { error } = await supabase.from("community_posts").insert({
    author_id: auth.uid,
    body,
    is_official: me?.role === "admin",
  });

  if (error) {
    // RLS blocks posting without an accepted-guidelines record, a community
    // profile, or when restricted — translate to calm copy.
    return {
      error:
        "We couldn't publish that. Make sure your community profile is set up and the guidelines are accepted — and try again.",
    };
  }
  revalidateCommunity();
  return { ok: true };
}

export async function updatePost(
  id: string,
  body: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > POST_MAX_LENGTH)
    return { error: `Posts can be 1–${POST_MAX_LENGTH} characters.` };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("community_posts")
    .update({ body: trimmed, edited_at: now, updated_at: now })
    .eq("id", id)
    .eq("author_id", auth.uid);
  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  return { ok: true };
}

export async function deletePost(id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const supabase = await createClient();
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", id)
    .eq("author_id", auth.uid);
  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  return { ok: true };
}

export async function toggleReaction(
  postId: string,
  like: boolean
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const supabase = await createClient();
  if (like) {
    const { error } = await supabase
      .from("community_reactions")
      .upsert(
        { post_id: postId, user_id: auth.uid },
        { onConflict: "post_id,user_id", ignoreDuplicates: true }
      );
    if (error) return { error: GENERIC_ERROR };
  } else {
    const { error } = await supabase
      .from("community_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", auth.uid);
    if (error) return { error: GENERIC_ERROR };
  }
  revalidateCommunity();
  return { ok: true };
}

/* ─── Comments ──────────────────────────────────────────────────────── */

export async function addComment(
  postId: string,
  body: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write a comment first." };
  if (trimmed.length > COMMENT_MAX_LENGTH)
    return { error: `Comments can be up to ${COMMENT_MAX_LENGTH} characters.` };
  if (!(await withinLimit("community_comments", "author_id", auth.uid, HOUR, 30)))
    return {
      error:
        "You've commented quite a lot in the past hour. Take a short break and try again soon.",
    };
  const supabase = await createClient();
  const { error } = await supabase.from("community_comments").insert({
    post_id: postId,
    author_id: auth.uid,
    body: trimmed,
  });
  if (error)
    return {
      error:
        "We couldn't add that comment. Make sure the guidelines are accepted and try again.",
    };
  revalidateCommunity();
  return { ok: true };
}

export async function editComment(
  id: string,
  body: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > COMMENT_MAX_LENGTH)
    return { error: `Comments can be 1–${COMMENT_MAX_LENGTH} characters.` };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("community_comments")
    .update({ body: trimmed, edited_at: now, updated_at: now })
    .eq("id", id)
    .eq("author_id", auth.uid);
  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  return { ok: true };
}

export async function deleteComment(id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const supabase = await createClient();
  const { error } = await supabase
    .from("community_comments")
    .delete()
    .eq("id", id)
    .eq("author_id", auth.uid);
  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  return { ok: true };
}

/* ─── Follows, connections, blocks ──────────────────────────────────── */

export async function toggleFollow(
  userId: string,
  follow: boolean
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (userId === auth.uid) return { error: "You can't follow yourself." };
  const supabase = await createClient();
  if (follow) {
    if (
      !(await withinLimit("community_follows", "follower_id", auth.uid, HOUR, 60))
    )
      return {
        error: "You're following people very quickly. Please slow down a little.",
      };
    const { error } = await supabase
      .from("community_follows")
      .upsert(
        { follower_id: auth.uid, followee_id: userId },
        { onConflict: "follower_id,followee_id", ignoreDuplicates: true }
      );
    if (error) return { error: "You can't follow this member right now." };
  } else {
    const { error } = await supabase
      .from("community_follows")
      .delete()
      .eq("follower_id", auth.uid)
      .eq("followee_id", userId);
    if (error) return { error: GENERIC_ERROR };
  }
  revalidateCommunity();
  return { ok: true };
}

function connectionActionError(message: string): string {
  if (message.includes("connection_not_allowed"))
    return "This member isn't accepting connection requests from you.";
  if (message.includes("connection_exists"))
    return "A connection or request already exists with this member.";
  if (message.includes("connection_cooldown"))
    return "Please wait 24 hours before sending this member another request.";
  if (
    message.includes("connection_request_unavailable") ||
    message.includes("connection_unavailable")
  )
    return "This connection request is no longer available.";
  if (message.includes("connection_blocked"))
    return "You can't connect with this member.";
  return GENERIC_ERROR;
}

function revalidateConnections() {
  revalidateCommunity();
  revalidatePath("/app/community/connections");
  revalidatePath("/app/notifications");
  revalidatePath("/dashboard");
}

export async function sendConnection(
  userId: string,
  note: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (!isUuid(userId) || userId === auth.uid)
    return { error: "Please choose another member to connect with." };
  if (note.trim().length > CONNECTION_NOTE_MAX_LENGTH)
    return {
      error: `Your note can be up to ${CONNECTION_NOTE_MAX_LENGTH} characters.`,
    };
  if (
    !(await withinLimit(
      "community_connections",
      "requester_id",
      auth.uid,
      DAY,
      30
    ))
  )
    return {
      error:
        "You've sent several connection requests today. Please try again tomorrow.",
    };

  const { error } = await callRpc("community_send_connection", {
    target: userId,
    note_text: normalizeConnectionNote(note),
  });
  if (error) return { error: connectionActionError(error.message) };
  revalidateConnections();
  return { ok: true };
}

export async function respondToConnection(
  connectionId: string,
  response: "accept" | "decline"
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (!isUuid(connectionId))
    return { error: "This connection request is no longer available." };

  const { error } = await callRpc("community_respond_connection", {
    connection_id: connectionId,
    accept_request: response === "accept",
  });
  if (error) return { error: connectionActionError(error.message) };
  revalidateConnections();
  return { ok: true };
}

export async function cancelConnectionRequest(
  connectionId: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (!isUuid(connectionId))
    return { error: "This connection request is no longer available." };

  const { error } = await callRpc("community_cancel_connection", {
    connection_id: connectionId,
  });
  if (error) return { error: connectionActionError(error.message) };
  revalidateConnections();
  return { ok: true };
}

export async function removeConnection(
  connectionId: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (!isUuid(connectionId))
    return { error: "This connection is no longer available." };

  const { error } = await callRpc("community_remove_connection", {
    connection_id: connectionId,
  });
  if (error) return { error: connectionActionError(error.message) };
  revalidateConnections();
  return { ok: true };
}

export async function blockUser(userId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (!(await withinLimit("community_blocks", "blocker_id", auth.uid, DAY, 20)))
    return {
      error:
        "You've reached today's blocking limit. If someone is harassing you, please also report them so our team can act.",
    };
  const { error } = await callRpc("community_block_user", { target: userId });
  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function unblockUser(userId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const { error } = await callRpc("community_unblock_user", { target: userId });
  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  revalidatePath("/app/settings");
  return { ok: true };
}

/* ─── Reports ───────────────────────────────────────────────────────── */

export async function submitReport(input: {
  targetType: CommunityReportTargetType;
  targetUserId: string;
  postId?: string;
  commentId?: string;
  category: CommunityReportCategory;
  details?: string;
}): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;

  if (!REPORT_CATEGORIES.includes(input.category))
    return { error: "Please choose a report category." };
  const details = input.details?.trim().slice(0, 1000) || null;

  const supabase = await createClient();

  // Rate protection: at most 10 reports per 24 hours per account.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("community_reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", auth.uid)
    .gte("created_at", dayAgo);
  if ((count ?? 0) >= 10)
    return {
      error:
        "You've reached the reporting limit for today. Our team reviews every report — thank you.",
    };

  // Snapshot an excerpt of the reported content for the moderation record.
  let excerpt: string | null = null;
  if (input.targetType === "post" && input.postId) {
    const { data } = await supabase
      .from("community_posts")
      .select("body")
      .eq("id", input.postId)
      .maybeSingle();
    excerpt = data?.body?.slice(0, 300) ?? null;
  } else if (input.targetType === "comment" && input.commentId) {
    const { data } = await supabase
      .from("community_comments")
      .select("body")
      .eq("id", input.commentId)
      .maybeSingle();
    excerpt = data?.body?.slice(0, 300) ?? null;
  }

  const { error } = await supabase.from("community_reports").insert({
    reporter_id: auth.uid,
    target_type: input.targetType,
    target_post_id: input.targetType === "post" ? input.postId ?? null : null,
    target_comment_id:
      input.targetType === "comment" ? input.commentId ?? null : null,
    target_user_id: input.targetUserId,
    category: input.category,
    details,
    content_excerpt: excerpt,
  });

  if (error) {
    // Unique index → duplicate report by the same person for the same item.
    if (error.message.toLowerCase().includes("duplicate"))
      return {
        error: "You've already reported this. Our team will review it.",
      };
    return { error: GENERIC_ERROR };
  }
  return { ok: true };
}

/* ─── Member search (called from the client directory) ──────────────── */

export async function searchMembersAction(
  params: MemberSearchParams
): Promise<CommunityMemberCard[]> {
  if (!isSupabaseConfigured) return [];
  return searchMembers(params);
}
