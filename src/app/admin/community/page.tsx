import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import {
  ModerationQueue,
  type ModerationRow,
  type PriorAction,
} from "@/components/ModerationQueue";
import type {
  CommunityModerationAction,
  CommunityReport,
} from "@/types/database";
import { CommunityMediaQueue } from "@/components/CommunityMediaQueue";
import { COMMUNITY_IMAGE_BUCKET } from "@/lib/community-posts";

export const metadata = { title: "Community moderation | Phapano+ Admin" };

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireAdmin();
  const query = await searchParams;
  const status =
    query.status === "resolved" || query.status === "dismissed"
      ? query.status
      : "open";

  let rows: ModerationRow[] = [];
  let mediaRows: {
    id: string;
    target: "post" | "attachment";
    kind: "image" | "pdf";
    body: string;
    imageUrl: string;
    imageAltText: string | null;
    authorName: string;
    createdAt: string;
  }[] = [];

  if (!ctx.demo) {
    const { data: pendingMedia } = await ctx.supabase
      .from("community_posts")
      .select(
        "id, body, image_path, image_alt_text, created_at, author:community_profiles(display_name)"
      )
      .eq("media_status", "pending")
      .eq("status", "published")
      .not("image_path", "is", null)
      .order("created_at", { ascending: true })
      .limit(50);
    const mediaPaths = (pendingMedia ?? [])
      .map((post) => post.image_path)
      .filter((path): path is string => Boolean(path));
    const { data: signedMedia } = mediaPaths.length
      ? await ctx.supabase.storage
          .from(COMMUNITY_IMAGE_BUCKET)
          .createSignedUrls(mediaPaths, 30 * 60)
      : { data: [] };
    const mediaUrlByPath = new Map(
      (signedMedia ?? [])
        .filter((item) => item.path && item.signedUrl)
        .map((item) => [item.path, item.signedUrl])
    );
    mediaRows = (pendingMedia ?? []).flatMap((post) => {
      const imageUrl = post.image_path
        ? mediaUrlByPath.get(post.image_path)
        : null;
      if (!imageUrl) return [];
      const author = Array.isArray(post.author) ? post.author[0] : post.author;
      return [{
        id: post.id,
        target: "post" as const,
        kind: "image" as const,
        body: post.body,
        imageUrl,
        imageAltText: post.image_alt_text,
        authorName: author?.display_name ?? "Phapano+ member",
        createdAt: post.created_at,
      }];
    });

    const { data: pendingAttachments } = await ctx.supabase
      .from("community_post_attachments")
      .select("id, post_id, storage_path, kind, created_at, post:community_posts(body, author_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);
    const attachmentPaths = (pendingAttachments ?? []).map(
      (attachment) => attachment.storage_path
    );
    const { data: signedAttachments } = attachmentPaths.length
      ? await ctx.supabase.storage
          .from(COMMUNITY_IMAGE_BUCKET)
          .createSignedUrls(attachmentPaths, 30 * 60)
      : { data: [] };
    const attachmentUrlByPath = new Map(
      (signedAttachments ?? [])
        .filter((item) => item.path && item.signedUrl)
        .map((item) => [item.path, item.signedUrl])
    );
    const attachmentAuthorIds = (pendingAttachments ?? [])
      .map((attachment) => {
        const post = Array.isArray(attachment.post)
          ? attachment.post[0]
          : attachment.post;
        return post?.author_id;
      })
      .filter((id): id is string => Boolean(id));
    const { data: attachmentAuthors } = attachmentAuthorIds.length
      ? await ctx.supabase
          .from("community_profiles")
          .select("user_id, display_name")
          .in("user_id", attachmentAuthorIds)
      : { data: [] };
    const attachmentAuthorNames = new Map(
      (attachmentAuthors ?? []).map((author) => [
        author.user_id,
        author.display_name,
      ])
    );
    mediaRows.push(
      ...(pendingAttachments ?? []).flatMap((attachment) => {
        const imageUrl = attachmentUrlByPath.get(attachment.storage_path);
        if (!imageUrl) return [];
        const post = Array.isArray(attachment.post)
          ? attachment.post[0]
          : attachment.post;
        return [{
          id: attachment.id,
          target: "attachment" as const,
          kind: attachment.kind as "image" | "pdf",
          body: post?.body ?? "",
          imageUrl,
          imageAltText: post?.body || null,
          authorName:
            attachmentAuthorNames.get(post?.author_id ?? "") ??
            "Phapano+ member or page",
          createdAt: attachment.created_at,
        }];
      })
    );

    const { data: reports } = await ctx.supabase
      .from("community_reports")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(100);

    const list = (reports ?? []) as CommunityReport[];
    if (list.length) {
      const userIds = Array.from(
        new Set(
          list
            .flatMap((r) => [r.reporter_id, r.target_user_id])
            .filter((id): id is string => Boolean(id))
        )
      );
      const targetIds = list
        .map((r) => r.target_user_id)
        .filter((id): id is string => Boolean(id));
      const postIds = list
        .map((r) => r.target_post_id)
        .filter((id): id is string => Boolean(id));
      const commentIds = list
        .map((r) => r.target_comment_id)
        .filter((id): id is string => Boolean(id));

      const [profiles, states, allReports, actions, posts, comments] =
        await Promise.all([
          userIds.length
            ? ctx.supabase
                .from("community_profiles")
                .select("user_id, display_name")
                .in("user_id", userIds)
            : Promise.resolve({ data: [] }),
          targetIds.length
            ? ctx.supabase
                .from("community_moderation_state")
                .select("*")
                .in("user_id", targetIds)
            : Promise.resolve({ data: [] }),
          targetIds.length
            ? ctx.supabase
                .from("community_reports")
                .select("target_user_id")
                .in("target_user_id", targetIds)
            : Promise.resolve({ data: [] }),
          targetIds.length
            ? ctx.supabase
                .from("community_moderation_actions")
                .select("*")
                .in("target_user_id", targetIds)
                .order("created_at", { ascending: false })
                .limit(200)
            : Promise.resolve({ data: [] }),
          postIds.length
            ? ctx.supabase
                .from("community_posts")
                .select("id, status")
                .in("id", postIds)
            : Promise.resolve({ data: [] }),
          commentIds.length
            ? ctx.supabase
                .from("community_comments")
                .select("id, status")
                .in("id", commentIds)
            : Promise.resolve({ data: [] }),
        ]);

      const nameOf = new Map(
        ((profiles.data ?? []) as { user_id: string; display_name: string }[]).map(
          (p) => [p.user_id, p.display_name]
        )
      );
      const stateOf = new Map(
        ((states.data ?? []) as {
          user_id: string;
          posting_restricted: boolean;
          community_suspended: boolean;
        }[]).map((s) => [s.user_id, s])
      );
      const priorCounts = new Map<string, number>();
      for (const r of (allReports.data ?? []) as { target_user_id: string | null }[]) {
        if (!r.target_user_id) continue;
        priorCounts.set(
          r.target_user_id,
          (priorCounts.get(r.target_user_id) ?? 0) + 1
        );
      }
      const actionsFor = new Map<string, PriorAction[]>();
      for (const a of (actions.data ?? []) as CommunityModerationAction[]) {
        if (!a.target_user_id) continue;
        const arr = actionsFor.get(a.target_user_id) ?? [];
        if (arr.length < 6)
          arr.push({
            action: a.action,
            notes: a.notes,
            created_at: a.created_at,
            by_me: a.admin_id === ctx.user.id,
          });
        actionsFor.set(a.target_user_id, arr);
      }
      const postStatus = new Map(
        ((posts.data ?? []) as { id: string; status: string }[]).map((p) => [
          p.id,
          p.status,
        ])
      );
      const commentStatus = new Map(
        ((comments.data ?? []) as { id: string; status: string }[]).map((c) => [
          c.id,
          c.status,
        ])
      );

      rows = list.map((r) => {
        const fallback = (id: string | null) =>
          id ? `Member ${id.slice(0, 8)}` : "Deleted account";
        let removed: boolean | null = null;
        if (r.target_type === "post" && r.target_post_id)
          removed = postStatus.get(r.target_post_id) === "removed";
        if (r.target_type === "comment" && r.target_comment_id)
          removed = commentStatus.get(r.target_comment_id) === "removed";
        const state = r.target_user_id ? stateOf.get(r.target_user_id) : undefined;
        return {
          ...r,
          reporter_name: r.reporter_id
            ? (nameOf.get(r.reporter_id) ?? fallback(r.reporter_id))
            : "Deleted account",
          reported_name: r.target_user_id
            ? (nameOf.get(r.target_user_id) ?? fallback(r.target_user_id))
            : "Deleted account",
          prior_reports: r.target_user_id
            ? (priorCounts.get(r.target_user_id) ?? 1)
            : 1,
          prior_actions: r.target_user_id
            ? (actionsFor.get(r.target_user_id) ?? [])
            : [],
          resolved_by_me: r.resolved_by === ctx.user.id,
          content_removed: removed,
          posting_restricted: Boolean(state?.posting_restricted),
          community_suspended: Boolean(state?.community_suspended),
        };
      });
    }
  }

  const tabs = [
    { id: "open", label: "Open" },
    { id: "resolved", label: "Resolved" },
    { id: "dismissed", label: "Dismissed" },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <h1 className="pt-8 font-sora text-2xl font-bold tracking-tight">
        Community moderation
      </h1>
      <p className="mt-2 text-sm text-charcoal-soft">
        Reports are private. Every action here is recorded in the moderation
        log, and removed content stays restorable.
      </p>

      <nav aria-label="Report status" className="mt-5 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/community${t.id === "open" ? "" : `?status=${t.id}`}`}
            aria-current={status === t.id ? "page" : undefined}
            className={`rounded-chip px-4 py-2 text-sm font-bold transition ${
              status === t.id
                ? "bg-charcoal text-paper"
                : "border border-line bg-paper text-charcoal-soft hover:text-charcoal"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {ctx.demo ? (
          <p className="text-sm text-charcoal-soft">
            Moderation is available once Supabase is connected.
          </p>
        ) : (
          <ModerationQueue rows={rows} />
        )}
      </div>
      {!ctx.demo && <CommunityMediaQueue rows={mediaRows} />}
    </main>
  );
}
