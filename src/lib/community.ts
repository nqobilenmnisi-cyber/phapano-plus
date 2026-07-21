import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  CommunityCommentView,
  CommunityMemberCard,
  CommunityPostView,
  CommunityProfile,
} from "@/types/database";

/* Version of the Community Guidelines users must accept before first post. */
export const COMMUNITY_TERMS_VERSION = "2026-07-v1";
export const COMMUNITY_TERMS_TYPE = "community_guidelines";

export {
  POST_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
} from "@/lib/community-constants";
import {
  POST_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
} from "@/lib/community-constants";
export const FEED_PAGE_SIZE = 20;
export const MEMBERS_PAGE_SIZE = 24;

/** Minimal untyped rpc escape hatch (Database.Functions stays permissive
 *  project-wide because typed Functions breaks supabase-js embed inference
 *  for the existing queries in lib/queries.ts). */
type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export async function getMyUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getMyCommunityProfile(): Promise<CommunityProfile | null> {
  if (!isSupabaseConfigured) return null;
  const uid = await getMyUserId();
  if (!uid) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_profiles")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  return (data as CommunityProfile | null) ?? null;
}

export async function getMyModerationState(): Promise<{
  posting_restricted: boolean;
  community_suspended: boolean;
}> {
  const none = { posting_restricted: false, community_suspended: false };
  if (!isSupabaseConfigured) return none;
  const uid = await getMyUserId();
  if (!uid) return none;
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_moderation_state")
    .select("posting_restricted, community_suspended")
    .eq("user_id", uid)
    .maybeSingle();
  return {
    posting_restricted: Boolean(data?.posting_restricted),
    community_suspended: Boolean(data?.community_suspended),
  };
}

export async function hasAcceptedGuidelines(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const uid = await getMyUserId();
  if (!uid) return false;
  const supabase = await createClient();
  const { count } = await supabase
    .from("community_terms_acceptances")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("document_type", COMMUNITY_TERMS_TYPE);
  return (count ?? 0) > 0;
}

/** IDs of accounts the current user has blocked (for query-side exclusion). */
async function getMyBlockedIds(uid: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_blocks")
    .select("blocked_id")
    .eq("blocker_id", uid);
  return (data ?? []).map((r) => r.blocked_id as string);
}

/* ─── Feeds ──────────────────────────────────────────────────────────── */

const POST_SELECT =
  "*, author:community_profiles(user_id, display_name, stage, avatar_url), community_reactions(count), community_comments(count)";

type RawPost = Record<string, unknown> & {
  author: CommunityPostView["author"];
  community_reactions: { count: number }[] | null;
  community_comments: { count: number }[] | null;
};

async function attachViewerState(
  rows: RawPost[],
  uid: string
): Promise<CommunityPostView[]> {
  const supabase = await createClient();
  const ids = rows.map((r) => r.id as string);
  let liked = new Set<string>();
  if (ids.length) {
    const { data } = await supabase
      .from("community_reactions")
      .select("post_id")
      .eq("user_id", uid)
      .in("post_id", ids);
    liked = new Set((data ?? []).map((r) => r.post_id as string));
  }
  return rows.map((r) => ({
    ...(r as unknown as CommunityPostView),
    author: r.author ?? null,
    like_count: r.community_reactions?.[0]?.count ?? 0,
    comment_count: r.community_comments?.[0]?.count ?? 0,
    liked_by_me: liked.has(r.id as string),
  }));
}

export async function getFeed(opts: {
  mode: "following" | "discover";
  before?: string;
}): Promise<{ posts: CommunityPostView[]; hasMore: boolean }> {
  if (!isSupabaseConfigured) return { posts: [], hasMore: false };
  const uid = await getMyUserId();
  if (!uid) return { posts: [], hasMore: false };
  const supabase = await createClient();

  let query = supabase
    .from("community_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE_SIZE + 1);

  if (opts.before) query = query.lt("created_at", opts.before);

  if (opts.mode === "following") {
    const { data: follows } = await supabase
      .from("community_follows")
      .select("followee_id")
      .eq("follower_id", uid);
    const ids = (follows ?? []).map((f) => f.followee_id as string);
    // People I follow, official Phapano posts, and my own posts.
    const parts = [`is_official.eq.true`, `author_id.eq.${uid}`];
    if (ids.length) parts.push(`author_id.in.(${ids.join(",")})`);
    query = query.or(parts.join(","));
  } else {
    // Discover: only members who chose to be visible. RLS already removes
    // blocked-both-ways and suspended authors; we additionally exclude
    // accounts the viewer has blocked (one-directional visibility rule).
    query = query.not("author", "is", null).eq("author.visibility", "visible");
    const blocked = await getMyBlockedIds(uid);
    if (blocked.length)
      query = query.not("author_id", "in", `(${blocked.join(",")})`);
  }

  const { data, error } = await query;
  if (error || !data) return { posts: [], hasMore: false };
  const rows = data as unknown as RawPost[];
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const posts = await attachViewerState(rows.slice(0, FEED_PAGE_SIZE), uid);
  return { posts, hasMore };
}

export async function getPostView(
  id: string
): Promise<CommunityPostView | null> {
  if (!isSupabaseConfigured) return null;
  const uid = await getMyUserId();
  if (!uid) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [post] = await attachViewerState([data as unknown as RawPost], uid);
  return post ?? null;
}

export async function getComments(
  postId: string
): Promise<CommunityCommentView[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_comments")
    .select(
      "*, author:community_profiles(user_id, display_name, stage, avatar_url)"
    )
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []) as unknown as CommunityCommentView[];
}

/* ─── Members ────────────────────────────────────────────────────────── */

export type MemberSearchParams = {
  q?: string;
  stage?: string;
  stream?: string;
  institution?: string;
};

export async function searchMembers(
  params: MemberSearchParams
): Promise<CommunityMemberCard[]> {
  if (!isSupabaseConfigured) return [];
  const uid = await getMyUserId();
  if (!uid) return [];
  const supabase = await createClient();

  let query = supabase
    .from("community_profiles")
    .select("user_id, display_name, stage, stream, institution, bio, avatar_url")
    .eq("visibility", "visible")
    .neq("user_id", uid)
    .order("display_name")
    .limit(MEMBERS_PAGE_SIZE);

  if (params.q?.trim())
    query = query.ilike("display_name", `%${params.q.trim()}%`);
  if (params.stage) query = query.eq("stage", params.stage as never);
  if (params.stream) query = query.eq("stream", params.stream as never);
  if (params.institution?.trim())
    query = query.ilike("institution", `%${params.institution.trim()}%`);

  const blocked = await getMyBlockedIds(uid);
  if (blocked.length)
    query = query.not("user_id", "in", `(${blocked.join(",")})`);

  const { data } = await query;
  return withFollowState((data ?? []) as CommunityMemberCard[], uid);
}

async function withFollowState(
  cards: CommunityMemberCard[],
  uid: string
): Promise<CommunityMemberCard[]> {
  if (!cards.length) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_follows")
    .select("followee_id")
    .eq("follower_id", uid)
    .in("followee_id", cards.map((c) => c.user_id));
  const followed = new Set((data ?? []).map((r) => r.followee_id as string));
  return cards.map((c) => ({ ...c, followed_by_me: followed.has(c.user_id) }));
}

export async function getFollowLists(): Promise<{
  followers: CommunityMemberCard[];
  following: CommunityMemberCard[];
}> {
  const empty = { followers: [], following: [] };
  if (!isSupabaseConfigured) return empty;
  const uid = await getMyUserId();
  if (!uid) return empty;
  const supabase = await createClient();

  const [followerRows, followingRows] = await Promise.all([
    supabase.from("community_follows").select("follower_id").eq("followee_id", uid),
    supabase.from("community_follows").select("followee_id").eq("follower_id", uid),
  ]);
  const followerIds = (followerRows.data ?? []).map((r) => r.follower_id as string);
  const followingIds = (followingRows.data ?? []).map((r) => r.followee_id as string);

  async function cardsFor(ids: string[]): Promise<CommunityMemberCard[]> {
    if (!ids.length) return [];
    const sb = await createClient();
    const { data } = await sb
      .from("community_profiles")
      .select("user_id, display_name, stage, stream, institution, bio, avatar_url")
      .in("user_id", ids)
      .order("display_name");
    return withFollowState((data ?? []) as CommunityMemberCard[], uid!);
  }

  const [followers, following] = await Promise.all([
    cardsFor(followerIds),
    cardsFor(followingIds),
  ]);
  return { followers, following };
}

export async function getMemberProfile(id: string): Promise<{
  profile: CommunityProfile | null;
  followers: number;
  following: number;
  followedByMe: boolean;
  blockedByMe: boolean;
  posts: CommunityPostView[];
} | null> {
  if (!isSupabaseConfigured) return null;
  const uid = await getMyUserId();
  if (!uid) return null;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("community_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: counts }, { data: followRow }, { data: blockRow }, postRes] =
    await Promise.all([
      (supabase as unknown as RpcClient).rpc("community_follow_counts", {
        target: id,
      }) as Promise<{ data: unknown; error: unknown }>,
      supabase
        .from("community_follows")
        .select("followee_id")
        .eq("follower_id", uid)
        .eq("followee_id", id)
        .maybeSingle(),
      supabase
        .from("community_blocks")
        .select("blocked_id")
        .eq("blocker_id", uid)
        .eq("blocked_id", id)
        .maybeSingle(),
      supabase
        .from("community_posts")
        .select(POST_SELECT)
        .eq("author_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const countRow = (counts as { followers: number; following: number }[] | null)?.[0];
  const posts = await attachViewerState(
    ((postRes.data ?? []) as unknown as RawPost[]),
    uid
  );

  return {
    profile: profile as CommunityProfile,
    followers: Number(countRow?.followers ?? 0),
    following: Number(countRow?.following ?? 0),
    followedByMe: !!followRow,
    blockedByMe: !!blockRow,
    posts,
  };
}

export async function getBlockedAccounts(): Promise<CommunityMemberCard[]> {
  if (!isSupabaseConfigured) return [];
  const uid = await getMyUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const blocked = await getMyBlockedIds(uid);
  if (!blocked.length) return [];
  const { data } = await supabase
    .from("community_profiles")
    .select("user_id, display_name, stage, stream, institution, bio, avatar_url")
    .in("user_id", blocked)
    .order("display_name");
  const found = (data ?? []) as CommunityMemberCard[];
  // Blocked accounts without a community profile still need a manageable row.
  const missing = blocked
    .filter((id) => !found.some((c) => c.user_id === id))
    .map((id) => ({
      user_id: id,
      display_name: "Phapano+ member",
      stage: null,
      stream: null,
      institution: null,
      bio: null,
      avatar_url: null,
      followed_by_me: false,
    }));
  return [...found, ...missing].map((c) => ({ ...c, followed_by_me: false }));
}

/** Untyped rpc helper for actions. */
export async function callRpc(
  fn: "community_block_user" | "community_unblock_user",
  args: Record<string, unknown>
): Promise<{ error: { message: string } | null }> {
  const supabase = await createClient();
  const { error } = await (supabase as unknown as RpcClient).rpc(fn, args);
  return { error };
}
