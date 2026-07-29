"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  normalizeCommunitySharingSelection,
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
import {
  COMMUNITY_IMAGE_BUCKET,
  extractFirstHttpUrl,
  normaliseHttpUrl,
  validCommunityImageMetadata,
  type LinkPreview,
} from "@/lib/community-posts";
import { fetchSafeLinkPreview } from "@/lib/community-link-preview";
import type {
  CommunityConnectionPermission,
  CommunityMemberCard,
  CommunityReportCategory,
  CommunityReportTargetType,
  CommunityImageMimeType,
  CommunityReactionType,
  CommunityVisibility,
} from "@/types/database";

export type ActionResult = { ok: true; id?: string } | { error: string };
export type LinkPreviewResult = { ok: true; preview: LinkPreview | null } | {
  error: string;
};

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

export type SubmittedMention = { userId: string; label: string };

function parseSubmittedMentions(raw: FormDataEntryValue | null): SubmittedMention[] {
  try {
    const parsed = JSON.parse(String(raw ?? "[]")) as unknown;
    if (!Array.isArray(parsed)) return [];
    const unique = new Map<string, SubmittedMention>();
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const userId = String((item as SubmittedMention).userId ?? "");
      const label = String((item as SubmittedMention).label ?? "").trim();
      if (isUuid(userId) && label.length >= 2 && label.length <= 60)
        unique.set(userId, { userId, label });
    }
    return [...unique.values()].slice(0, 20);
  } catch {
    return [];
  }
}

async function saveMentions(input: {
  postId?: string;
  commentId?: string;
  body: string;
  actorId: string;
  submitted: SubmittedMention[];
}) {
  const submitted = input.submitted.filter(
    (mention) =>
      mention.userId !== input.actorId &&
      input.body.includes(`@${mention.label}`)
  );
  if (!submitted.length) return;
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("community_profiles")
    .select("user_id, display_name")
    .in(
      "user_id",
      submitted.map((mention) => mention.userId)
    );
  const canonical = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      profile.display_name as string,
    ])
  );
  const rows = submitted
    .filter(
      (mention) =>
        canonical.get(mention.userId) === mention.label &&
        input.body.includes(`@${mention.label}`)
    )
    .map((mention) => ({
      post_id: input.postId ?? null,
      comment_id: input.commentId ?? null,
      mentioned_user_id: mention.userId,
      created_by: input.actorId,
      label: mention.label,
    }));
  if (rows.length) await supabase.from("community_mentions").insert(rows);
}

/* ─── Community profile ─────────────────────────────────────────────── */

export async function saveCommunityProfile(
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;

  const display_name = String(formData.get("display_name") ?? "").trim();
  const profileTextInput = {
    headline: String(formData.get("headline") ?? ""),
    stage: "",
    stageOther: "",
    stream: "",
    streamOther: "",
    institution: "",
    bio: "",
  };
  const profileText = normalizeCommunityProfileText(profileTextInput);
  const visibility = String(
    formData.get("visibility") ?? "visible"
  ) as CommunityVisibility;
  const connection_permission = String(
    formData.get("connection_permission") ?? "everyone"
  ) as CommunityConnectionPermission;
  const sharing = normalizeCommunitySharingSelection(
    formData.getAll("shared_fields").map(String)
  );

  if (display_name.length < 2 || display_name.length > 60)
    return { error: "Please choose a display name of 2–60 characters." };
  const profileTextError = validateCommunityProfileText(profileTextInput);
  if (profileTextError) return { error: profileTextError };
  if (!VISIBILITIES.includes(visibility))
    return { error: "Please choose a valid visibility option." };
  if (!CONNECTION_PERMISSIONS.includes(connection_permission))
    return { error: "Please choose who may send you connection requests." };

  const supabase = await createClient();

  // Preferences live on the private Passport. Updating it first resyncs an
  // existing public projection; a new Community row is projected on insert.
  const { error: sharingError } = await supabase
    .from("profiles")
    .update({ ...sharing, updated_at: new Date().toISOString() })
    .eq("id", auth.uid);
  if (sharingError) return { error: GENERIC_ERROR };

  const { error } = await supabase.from("community_profiles").upsert(
    {
      user_id: auth.uid,
      display_name,
      headline: profileText.headline,
      visibility,
      connection_permission,
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

  if (!(await withinLimit("community_posts", "created_by", auth.uid, HOUR, 10)))
    return {
      error:
        "You've posted quite a lot in the past hour. Take a short break and try again soon.",
    };

  const supabase = await createClient();
  const authorId = String(formData.get("author_id") ?? auth.uid);
  const { data: organisation } = await supabase
    .from("organisation_pages")
    .select("id, is_official")
    .eq("id", authorId)
    .eq("status", "active")
    .maybeSingle();
  if (authorId !== auth.uid) {
    const { data: pageAdmin } = await supabase
      .from("organisation_page_admins")
      .select("role")
      .eq("page_id", authorId)
      .eq("user_id", auth.uid)
      .maybeSingle();
    if (!pageAdmin)
      return { error: "You do not have permission to post as that page." };
  }

  const imagePath = String(formData.get("image_path") ?? "").trim();
  const imageMimeType = String(formData.get("image_mime_type") ?? "").trim();
  const imageSize = Number(formData.get("image_size_bytes") ?? 0);
  const imageAltText = String(formData.get("image_alt_text") ?? "").trim();
  if (
    imagePath &&
    !validCommunityImageMetadata({
      path: imagePath,
      actorId: auth.uid,
      mimeType: imageMimeType,
      size: imageSize,
    })
  )
    return { error: "That image is not a valid JPEG, PNG or WebP under 5 MB." };
  if (imageAltText.length > 300)
    return { error: "Image descriptions can be up to 300 characters." };

  if (imagePath) {
    const segments = imagePath.split("/");
    const fileName = segments.at(-1) ?? "";
    const folder = segments.slice(0, -1).join("/");
    const { data: files, error: fileError } = await supabase.storage
      .from(COMMUNITY_IMAGE_BUCKET)
      .list(folder, { limit: 10, search: fileName });
    const storedFile = files?.find((file) => file.name === fileName);
    const storedMetadata = (storedFile?.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const storedSize = Number(storedMetadata.size ?? 0);
    const storedMimeType = String(
      storedMetadata.mimetype ?? storedMetadata.contentType ?? ""
    );
    if (
      fileError ||
      !storedFile ||
      !validCommunityImageMetadata({
        path: imagePath,
        actorId: auth.uid,
        mimeType: storedMimeType,
        size: storedSize,
      })
    )
      return { error: "The uploaded image could not be verified. Please add it again." };
    if (storedMimeType !== imageMimeType || storedSize !== imageSize)
      return { error: "The uploaded image details did not match. Please add it again." };
  }

  const includePreview = formData.get("include_link_preview") === "true";
  const linkInBody = extractFirstHttpUrl(body);
  const preview =
    includePreview && linkInBody ? await fetchSafeLinkPreview(linkInBody) : null;

  const { data: createdPost, error } = await supabase
    .from("community_posts")
    .insert({
      author_id: authorId,
      created_by: auth.uid,
      body,
      is_official: Boolean(organisation?.is_official),
      image_path: imagePath || null,
      image_alt_text: imageAltText || null,
      image_mime_type: imagePath
        ? (imageMimeType as CommunityImageMimeType)
        : null,
      image_size_bytes: imagePath ? imageSize : null,
      media_status: imagePath ? "pending" : "none",
      link_url: preview?.url ?? null,
      link_title: preview?.title ?? null,
      link_site_name: preview?.siteName ?? null,
      link_description: preview?.description ?? null,
      link_image_url: preview?.imageUrl ?? null,
    })
    .select("id")
    .single();

  if (error) {
    // RLS blocks posting without an accepted-guidelines record, a community
    // profile, or when restricted — translate to calm copy.
    return {
      error:
        "We couldn't publish that. Make sure your community profile is set up and the guidelines are accepted — and try again.",
    };
  }
  await saveMentions({
    postId: createdPost.id,
    body,
    actorId: auth.uid,
    submitted: parseSubmittedMentions(formData.get("mentions")),
  });
  revalidateCommunity();
  return { ok: true, id: createdPost.id };
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
  const link = extractFirstHttpUrl(trimmed);
  const preview = link ? await fetchSafeLinkPreview(link) : null;
  const { error } = await supabase
    .from("community_posts")
    .update({
      body: trimmed,
      edited_at: now,
      updated_at: now,
      link_url: preview?.url ?? null,
      link_title: preview?.title ?? null,
      link_site_name: preview?.siteName ?? null,
      link_description: preview?.description ?? null,
      link_image_url: preview?.imageUrl ?? null,
    })
    .eq("id", id)
    .eq("created_by", auth.uid);
  if (error) return { error: GENERIC_ERROR };
  revalidateCommunity();
  return { ok: true };
}

export async function deletePost(id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("community_posts")
    .select("image_path")
    .eq("id", id)
    .eq("created_by", auth.uid)
    .maybeSingle();
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", id)
    .eq("created_by", auth.uid);
  if (error) return { error: GENERIC_ERROR };
  if (post?.image_path)
    await supabase.storage
      .from(COMMUNITY_IMAGE_BUCKET)
      .remove([post.image_path]);
  revalidateCommunity();
  return { ok: true };
}

export async function toggleReaction(
  postId: string,
  reaction: CommunityReactionType | null
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const supabase = await createClient();
  if (reaction) {
    const { error: removeError } = await supabase
      .from("community_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", auth.uid);
    if (removeError) return { error: GENERIC_ERROR };
    const { error: insertError } = await supabase
      .from("community_reactions")
      .insert({ post_id: postId, user_id: auth.uid, reaction_type: reaction });
    if (insertError) return { error: GENERIC_ERROR };
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

export async function passOnPost(postId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (!isUuid(postId)) return { error: "That post is not available." };
  if (!(await withinLimit("community_posts", "created_by", auth.uid, HOUR, 10)))
    return { error: "You've posted quite a lot. Try passing this on again later." };
  const supabase = await createClient();
  const { count: acceptanceCount } = await supabase
    .from("community_terms_acceptances")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.uid)
    .eq("document_type", COMMUNITY_TERMS_TYPE)
    .eq("document_version", COMMUNITY_TERMS_VERSION);
  if (!acceptanceCount)
    return {
      error:
        "Please accept the current Community Guidelines by posting or commenting before passing a post on.",
    };
  const { data: source } = await supabase
    .from("community_posts")
    .select("id, reshared_post_id")
    .eq("id", postId)
    .eq("status", "published")
    .maybeSingle();
  if (!source) return { error: "That post is no longer available." };
  const originalId = source.reshared_post_id ?? source.id;
  const { error } = await supabase.from("community_posts").insert({
    author_id: auth.uid,
    created_by: auth.uid,
    body: "",
    is_official: false,
    reshared_post_id: originalId,
  });
  if (error)
    return {
      error: error.code === "23505"
        ? "You have already passed this post on."
        : GENERIC_ERROR,
    };
  revalidateCommunity();
  return { ok: true };
}

export async function previewPostLink(url: string): Promise<LinkPreviewResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const safeUrl = normaliseHttpUrl(url);
  if (!safeUrl) return { error: "Add a valid http or https link." };
  const preview = await fetchSafeLinkPreview(safeUrl);
  return { ok: true, preview };
}

/* ─── Comments ──────────────────────────────────────────────────────── */

export async function addComment(
  postId: string,
  body: string,
  authorId?: string,
  mentions: SubmittedMention[] = []
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write a comment first." };
  if (trimmed.length > COMMENT_MAX_LENGTH)
    return { error: `Comments can be up to ${COMMENT_MAX_LENGTH} characters.` };
  if (!(await withinLimit("community_comments", "created_by", auth.uid, HOUR, 30)))
    return {
      error:
        "You've commented quite a lot in the past hour. Take a short break and try again soon.",
    };
  const supabase = await createClient();
  const identityId = authorId || auth.uid;
  if (identityId !== auth.uid) {
    const { data: pageAdmin } = await supabase
      .from("organisation_page_admins")
      .select("role")
      .eq("page_id", identityId)
      .eq("user_id", auth.uid)
      .maybeSingle();
    if (!pageAdmin)
      return { error: "You do not have permission to reply as that page." };
  }
  const { data: createdComment, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: postId,
      author_id: identityId,
      created_by: auth.uid,
      body: trimmed,
    })
    .select("id")
    .single();
  if (error)
    return {
      error:
        "We couldn't add that comment. Make sure the guidelines are accepted and try again.",
    };
  await saveMentions({
    commentId: createdComment.id,
    body: trimmed,
    actorId: auth.uid,
    submitted: mentions,
  });
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
    .eq("created_by", auth.uid);
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
    .eq("created_by", auth.uid);
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
  const supabase = await createClient();
  const { count: organisationCount } = await supabase
    .from("organisation_pages")
    .select("id", { count: "exact", head: true })
    .eq("id", userId)
    .eq("status", "active");
  if ((organisationCount ?? 0) > 0)
    return {
      error:
        "Organisation pages are follow-only and do not accept connection requests.",
    };
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
