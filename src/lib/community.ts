import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  CommunityCommentView,
  CommunityConnection,
  CommunityConnectionItem,
  CommunityConnectionState,
  CommunityEmbeddedPost,
  CommunityMemberCard,
  CommunityPostView,
  CommunityProfile,
  OrganisationPage,
  ProfileVerificationBadge,
  CommunityReactionType,
} from "@/types/database";
import { COMMUNITY_IMAGE_BUCKET } from "@/lib/community-posts";
import {
  canRequestConnection,
  connectionStateFor,
  isUuid,
} from "@/lib/community-connections";

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
    .eq("document_type", COMMUNITY_TERMS_TYPE)
    .eq("document_version", COMMUNITY_TERMS_VERSION);
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
  "*, author:community_profiles(user_id, display_name, headline, stage, avatar_url), community_comments(count)";

type RawPost = Record<string, unknown> & {
  author: CommunityPostView["author"];
  community_comments: { count: number }[] | null;
};

async function attachViewerState(
  rows: RawPost[],
  uid: string
): Promise<CommunityPostView[]> {
  const supabase = await createClient();
  const ids = rows.map((r) => r.id as string);
  const reactionCounts = new Map<
    string,
    Record<CommunityReactionType, number>
  >();
  const myReactions = new Map<string, CommunityReactionType>();
  const passCounts = new Map<string, number>();
  const passedByMe = new Set<string>();
  const managedIds = new Set<string>([uid]);
  const imagePaths = rows
    .filter((row) => row.media_status === "approved" && row.image_path)
    .map((row) => row.image_path as string);
  const signedUrls = new Map<string, string>();
  const resharedIds = Array.from(
    new Set(
      rows
        .map((row) => row.reshared_post_id as string | null)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (ids.length) {
    const [{ data: reactions }, { data: passes }, { data: admins }] =
      await Promise.all([
        supabase
          .from("community_reactions")
          .select("post_id, user_id, reaction_type")
          .in("post_id", ids),
        supabase
          .from("community_posts")
          .select("reshared_post_id, created_by")
          .in("reshared_post_id", ids)
          .eq("status", "published"),
        supabase
          .from("organisation_page_admins")
          .select("page_id")
          .eq("user_id", uid),
      ]);
    for (const row of reactions ?? []) {
      const postId = row.post_id as string;
      const type = row.reaction_type as CommunityReactionType;
      const counts = reactionCounts.get(postId) ?? {
        support: 0,
        helpful: 0,
        celebrate: 0,
      };
      counts[type] += 1;
      reactionCounts.set(postId, counts);
      if (row.user_id === uid) myReactions.set(postId, type);
    }
    for (const row of passes ?? []) {
      const originalId = row.reshared_post_id as string;
      passCounts.set(originalId, (passCounts.get(originalId) ?? 0) + 1);
      if (row.created_by === uid) passedByMe.add(originalId);
    }
    for (const row of admins ?? []) managedIds.add(row.page_id as string);
  }

  if (imagePaths.length) {
    const { data } = await supabase.storage
      .from(COMMUNITY_IMAGE_BUCKET)
      .createSignedUrls(imagePaths, 60 * 60);
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) signedUrls.set(row.path, row.signedUrl);
    }
  }

  const embedded = new Map<string, CommunityEmbeddedPost>();
  if (resharedIds.length) {
    const { data } = await supabase
      .from("community_posts")
      .select(POST_SELECT)
      .in("id", resharedIds)
      .eq("status", "published");
    const originals = (data ?? []) as unknown as RawPost[];
    const originalPaths = originals
      .filter((row) => row.media_status === "approved" && row.image_path)
      .map((row) => row.image_path as string);
    if (originalPaths.length) {
      const { data: originalUrls } = await supabase.storage
        .from(COMMUNITY_IMAGE_BUCKET)
        .createSignedUrls(originalPaths, 60 * 60);
      for (const row of originalUrls ?? []) {
        if (row.path && row.signedUrl) signedUrls.set(row.path, row.signedUrl);
      }
    }
    for (const row of originals) {
      const post = row as unknown as CommunityEmbeddedPost;
      embedded.set(post.id, {
        ...post,
        author: row.author ?? null,
        image_url:
          post.image_path && post.media_status === "approved"
            ? signedUrls.get(post.image_path) ?? null
            : null,
      });
    }
  }

  return rows.map((r) => ({
    ...(r as unknown as CommunityPostView),
    author: r.author ?? null,
    image_url:
      r.image_path && r.media_status === "approved"
        ? signedUrls.get(r.image_path as string) ?? null
        : null,
    reaction_counts: reactionCounts.get(r.id as string) ?? {
      support: 0,
      helpful: 0,
      celebrate: 0,
    },
    my_reaction: myReactions.get(r.id as string) ?? null,
    like_count: Object.values(reactionCounts.get(r.id as string) ?? {}).reduce(
      (sum, value) => sum + value,
      0
    ),
    comment_count: r.community_comments?.[0]?.count ?? 0,
    pass_count: passCounts.get(r.id as string) ?? 0,
    passed_by_me: passedByMe.has(r.id as string),
    can_manage:
      r.created_by === uid || managedIds.has(r.author_id as string),
    reshared_post: r.reshared_post_id
      ? embedded.get(r.reshared_post_id as string) ?? null
      : null,
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

  const { data: organisationRows } = await supabase
    .from("organisation_pages")
    .select("*")
    .eq("status", "active")
    .order("name")
    .limit(MEMBERS_PAGE_SIZE);
  const organisations = (organisationRows ?? []) as OrganisationPage[];
  const organisationIds = organisations.map((page) => page.id);

  let query = supabase
    .from("community_profiles")
    .select("user_id, display_name, headline, stage, stream, institution, bio, avatar_url")
    .eq("visibility", "visible")
    .neq("user_id", uid)
    .order("display_name")
    .limit(MEMBERS_PAGE_SIZE);

  if (organisationIds.length)
    query = query.not("user_id", "in", `(${organisationIds.join(",")})`);
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
  const people = await decorateMemberCards(
    (data ?? []) as CommunityMemberCard[]
  );
  const search = params.q?.trim().toLocaleLowerCase("en-ZA");
  const organisationCards =
    params.stage || params.stream || params.institution?.trim()
      ? []
      : organisations
          .filter(
            (page) =>
              !search ||
              page.name.toLocaleLowerCase("en-ZA").includes(search) ||
              page.tagline?.toLocaleLowerCase("en-ZA").includes(search)
          )
          .filter((page) => !blocked.includes(page.id))
          .filter((page) => page.id !== uid)
          .map(
            (page) =>
              ({
                user_id: page.id,
                display_name: page.name,
                headline: page.tagline,
                stage: null,
                stream: null,
                institution: null,
                bio: page.about,
                avatar_url: page.avatar_url,
                followed_by_me: false,
                identity_type: "organisation",
                organisation_type: page.page_type,
              }) satisfies CommunityMemberCard
          );

  return withFollowState(
    [...people, ...organisationCards]
      .sort((a, b) => a.display_name.localeCompare(b.display_name, "en-ZA"))
      .slice(0, MEMBERS_PAGE_SIZE),
    uid
  );
}

async function decorateMemberCards(
  cards: CommunityMemberCard[]
): Promise<CommunityMemberCard[]> {
  if (!cards.length) return [];
  const supabase = await createClient();
  const ids = cards.map((card) => card.user_id);
  const [{ data: pageRows }, { data: verificationRows }] = await Promise.all([
    supabase
      .from("organisation_pages")
      .select("*")
      .in("id", ids)
      .eq("status", "active"),
    supabase
      .from("profile_verifications")
      .select("user_id, badge")
      .in("user_id", ids),
  ]);
  const pageById = new Map(
    ((pageRows ?? []) as OrganisationPage[]).map((page) => [page.id, page])
  );
  const badgesById = new Map<string, ProfileVerificationBadge[]>();
  for (const row of verificationRows ?? []) {
    const current = badgesById.get(row.user_id as string) ?? [];
    current.push(row.badge as ProfileVerificationBadge);
    badgesById.set(row.user_id as string, current);
  }

  return cards.map((card) => {
    const page = pageById.get(card.user_id);
    if (page) {
      return {
        ...card,
        display_name: page.name,
        headline: page.tagline,
        stage: null,
        stream: null,
        institution: null,
        bio: page.about,
        avatar_url: page.avatar_url,
        identity_type: "organisation",
        organisation_type: page.page_type,
        verification_badges: [],
      };
    }
    return {
      ...card,
      identity_type: "person",
      verification_badges: badgesById.get(card.user_id) ?? [],
    };
  });
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
      .select("user_id, display_name, headline, stage, stream, institution, bio, avatar_url")
      .in("user_id", ids)
      .order("display_name");
    return withFollowState(
      await decorateMemberCards((data ?? []) as CommunityMemberCard[]),
      uid!
    );
  }

  const [followers, following] = await Promise.all([
    cardsFor(followerIds),
    cardsFor(followingIds),
  ]);
  return { followers, following };
}

export async function getConnectionHub(): Promise<{
  connections: CommunityConnectionItem[];
  incoming: CommunityConnectionItem[];
  outgoing: CommunityConnectionItem[];
}> {
  const empty = { connections: [], incoming: [], outgoing: [] };
  if (!isSupabaseConfigured) return empty;
  const uid = await getMyUserId();
  if (!uid) return empty;
  const supabase = await createClient();

  const { data } = await supabase
    .from("community_connections")
    .select("*")
    .or(`requester_id.eq.${uid},recipient_id.eq.${uid}`)
    .in("status", ["pending", "accepted"])
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as CommunityConnection[];
  if (!rows.length) return empty;

  const memberIds = Array.from(
    new Set(
      rows.map((row) =>
        row.requester_id === uid ? row.recipient_id : row.requester_id
      )
    )
  );
  const { data: profileRows } = await supabase
    .from("community_profiles")
    .select(
      "user_id, display_name, headline, stage, stream, institution, bio, avatar_url"
    )
    .in("user_id", memberIds);
  const cards = await withFollowState(
    (profileRows ?? []) as CommunityMemberCard[],
    uid
  );
  const cardById = new Map(cards.map((card) => [card.user_id, card]));

  const items = rows.map((row): CommunityConnectionItem => {
    const memberId =
      row.requester_id === uid ? row.recipient_id : row.requester_id;
    const member =
      cardById.get(memberId) ??
      ({
        user_id: memberId,
        display_name: "Phapano+ member",
        headline: null,
        stage: null,
        stream: null,
        institution: null,
        bio: null,
        avatar_url: null,
        followed_by_me: false,
      } satisfies CommunityMemberCard);
    const direction =
      row.status === "accepted"
        ? "connected"
        : row.requester_id === uid
          ? "outgoing"
          : "incoming";
    return {
      connection_id: row.id,
      status: row.status as "pending" | "accepted",
      direction,
      note: row.note,
      created_at: row.created_at,
      member,
    };
  });

  return {
    connections: items.filter((item) => item.direction === "connected"),
    incoming: items.filter((item) => item.direction === "incoming"),
    outgoing: items.filter((item) => item.direction === "outgoing"),
  };
}

export async function getMemberProfile(id: string): Promise<{
  profile: CommunityProfile | null;
  followers: number;
  following: number;
  connections: number;
  followedByMe: boolean;
  blockedByMe: boolean;
  connectionId: string | null;
  connectionState: CommunityConnectionState;
  connectionNote: string | null;
  canConnect: boolean;
  posts: CommunityPostView[];
  verificationBadges: ProfileVerificationBadge[];
} | null> {
  if (!isSupabaseConfigured) return null;
  const uid = await getMyUserId();
  if (!uid || !isUuid(id)) return null;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("community_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();
  if (!profile) return null;

  const [
    { data: counts },
    { data: connectionCount },
    { data: followRow },
    { data: targetFollowRow },
    { data: blockRow },
    { data: connectionRow },
    { data: verificationRows },
    postRes,
  ] = await Promise.all([
      (supabase as unknown as RpcClient).rpc("community_follow_counts", {
        target: id,
      }) as Promise<{ data: unknown; error: unknown }>,
      (supabase as unknown as RpcClient).rpc("community_connection_count", {
        target: id,
      }) as Promise<{ data: unknown; error: unknown }>,
      supabase
        .from("community_follows")
        .select("followee_id")
        .eq("follower_id", uid)
        .eq("followee_id", id)
        .maybeSingle(),
      supabase
        .from("community_follows")
        .select("followee_id")
        .eq("follower_id", id)
        .eq("followee_id", uid)
        .maybeSingle(),
      supabase
        .from("community_blocks")
        .select("blocked_id")
        .eq("blocker_id", uid)
        .eq("blocked_id", id)
        .maybeSingle(),
      supabase
        .from("community_connections")
        .select("*")
        .or(
          `and(requester_id.eq.${uid},recipient_id.eq.${id}),and(requester_id.eq.${id},recipient_id.eq.${uid})`
        )
        .in("status", ["pending", "accepted"])
        .maybeSingle(),
      supabase
        .from("profile_verifications")
        .select("badge")
        .eq("user_id", id),
      supabase
        .from("community_posts")
        .select(POST_SELECT)
        .eq("author_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const countRow = (counts as { followers: number; following: number }[] | null)?.[0];
  const activeConnection =
    (connectionRow as CommunityConnection | null) ?? null;
  const connectionState = connectionStateFor(activeConnection, uid);
  const posts = await attachViewerState(
    ((postRes.data ?? []) as unknown as RawPost[]),
    uid
  );

  return {
    profile: profile as CommunityProfile,
    followers: Number(countRow?.followers ?? 0),
    following: Number(countRow?.following ?? 0),
    connections: Number(connectionCount ?? 0),
    followedByMe: !!followRow,
    blockedByMe: !!blockRow,
    connectionId: activeConnection?.id ?? null,
    connectionState,
    connectionNote:
      connectionState === "incoming_pending" ? activeConnection?.note ?? null : null,
    canConnect:
      id !== uid &&
      connectionState === "none" &&
      canRequestConnection(
        (profile as CommunityProfile).connection_permission,
        !!targetFollowRow
      ),
    posts,
    verificationBadges: (verificationRows ?? []).map(
      (row) => row.badge as ProfileVerificationBadge
    ),
  };
}

export async function getOrganisationProfile(id: string): Promise<{
  page: OrganisationPage;
  parentPage: Pick<OrganisationPage, "id" | "name"> | null;
  followers: number;
  following: number;
  followedByMe: boolean;
  blockedByMe: boolean;
  canManage: boolean;
  posts: CommunityPostView[];
} | null> {
  if (!isSupabaseConfigured) return null;
  const uid = await getMyUserId();
  if (!uid || !isUuid(id)) return null;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("organisation_pages")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (!page) return null;

  const [
    { data: counts },
    { data: followRow },
    { data: blockRow },
    { data: adminRow },
    parentPageRes,
    postRes,
  ] = await Promise.all([
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
      .from("organisation_page_admins")
      .select("role")
      .eq("page_id", id)
      .eq("user_id", uid)
      .maybeSingle(),
    page.parent_page_id
      ? supabase
          .from("organisation_pages")
          .select("id, name")
          .eq("id", page.parent_page_id)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("community_posts")
      .select(POST_SELECT)
      .eq("author_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const countRow = (
    counts as { followers: number; following: number }[] | null
  )?.[0];
  const posts = await attachViewerState(
    (postRes.data ?? []) as unknown as RawPost[],
    uid
  );

  return {
    page: page as OrganisationPage,
    parentPage:
      (parentPageRes.data as Pick<OrganisationPage, "id" | "name"> | null) ??
      null,
    followers: Number(countRow?.followers ?? 0),
    following: Number(countRow?.following ?? 0),
    followedByMe: !!followRow,
    blockedByMe: !!blockRow,
    canManage: !!adminRow,
    posts,
  };
}

export async function getManagedOrganisationPages(): Promise<
  OrganisationPage[]
> {
  if (!isSupabaseConfigured) return [];
  const uid = await getMyUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data: adminRows } = await supabase
    .from("organisation_page_admins")
    .select("page_id")
    .eq("user_id", uid);
  const ids = (adminRows ?? []).map((row) => row.page_id as string);
  if (!ids.length) return [];
  const { data } = await supabase
    .from("organisation_pages")
    .select("*")
    .in("id", ids)
    .eq("status", "active")
    .order("name");
  return (data ?? []) as OrganisationPage[];
}

export async function getMyProfileVerifications(): Promise<
  ProfileVerificationBadge[]
> {
  if (!isSupabaseConfigured) return [];
  const uid = await getMyUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_verifications")
    .select("badge")
    .eq("user_id", uid);
  return (data ?? []).map((row) => row.badge as ProfileVerificationBadge);
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
    .select("user_id, display_name, headline, stage, stream, institution, bio, avatar_url")
    .in("user_id", blocked)
    .order("display_name");
  const found = (data ?? []) as CommunityMemberCard[];
  // Blocked accounts without a community profile still need a manageable row.
  const missing = blocked
    .filter((id) => !found.some((c) => c.user_id === id))
    .map((id) => ({
      user_id: id,
      display_name: "Phapano+ member",
      headline: null,
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
  fn:
    | "community_block_user"
    | "community_unblock_user"
    | "community_send_connection"
    | "community_respond_connection"
    | "community_cancel_connection"
    | "community_remove_connection",
  args: Record<string, unknown>
): Promise<{ error: { message: string } | null }> {
  const supabase = await createClient();
  const { error } = await (supabase as unknown as RpcClient).rpc(fn, args);
  return { error };
}
