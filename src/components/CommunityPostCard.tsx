"use client";

import Link from "next/link";
import { useState, useTransition, useOptimistic } from "react";
import {
  deletePost,
  toggleReaction,
  updatePost,
} from "@/app/(app)/app/community/actions";
import { MemberAvatar, timeAgo } from "@/components/CommunityShared";
import { ReportDialog } from "@/components/ReportDialog";
import { POST_MAX_LENGTH } from "@/lib/community-constants";
import type { CommunityPostView } from "@/types/database";

export function CommunityPostCard({
  post,
  viewerId,
  detail = false,
}: {
  post: CommunityPostView;
  viewerId: string;
  detail?: boolean;
}) {
  const mine = post.author_id === viewerId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [reporting, setReporting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [liked, setLikedOptimistic] = useOptimistic(
    { on: post.liked_by_me, count: post.like_count },
    (_state, next: { on: boolean; count: number }) => next
  );

  if (deleted) return null;

  const name = post.author?.display_name ?? "Phapano+ member";

  function onLike() {
    const next = {
      on: !liked.on,
      count: liked.count + (liked.on ? -1 : 1),
    };
    startTransition(async () => {
      setLikedOptimistic(next);
      const result = await toggleReaction(post.id, next.on);
      if ("error" in result) setError(result.error);
    });
  }

  function saveEdit() {
    startTransition(async () => {
      const result = await updatePost(post.id, draft);
      if ("error" in result) setError(result.error);
      else setEditing(false);
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deletePost(post.id);
      if ("error" in result) setError(result.error);
      else setDeleted(true);
    });
  }

  return (
    <article className="card overflow-hidden border-line/90">
      {post.is_official && (
        <div className="h-1 bg-gradient-to-r from-blue-action to-blue" />
      )}
      <div className="p-5">
      <header className="flex items-start gap-3">
        <Link
          href={`/app/community/member/${post.author_id}`}
          aria-label={`View ${name}'s profile`}
        >
          <MemberAvatar name={name} avatarUrl={post.author?.avatar_url ?? null} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <Link
              href={`/app/community/member/${post.author_id}`}
              className="max-w-full truncate font-semibold text-charcoal hover:underline"
            >
              {name}
            </Link>
            {post.is_official && (
              <span className="rounded-chip bg-blue-action/10 px-2 py-0.5 text-[0.65rem] font-bold text-blue-action">
                Phapano+
              </span>
            )}
          </div>
          <p className="text-xs text-charcoal-soft">
            {post.author?.headline ? `${post.author.headline} · ` : ""}
            <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
            {post.edited_at ? " · edited" : ""}
          </p>
        </div>
      </header>

      {editing ? (
        <div className="mt-3">
          <label className="sr-only" htmlFor={`edit-${post.id}`}>
            Edit post
          </label>
          <textarea
            id={`edit-${post.id}`}
            className="input min-h-24"
            value={draft}
            maxLength={POST_MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            disabled={pending}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="btn-secondary"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setDraft(post.body);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={pending || !draft.trim()}
              onClick={saveEdit}
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-charcoal">
          {post.body}
        </p>
      )}

      {error && (
        <p
          aria-live="polite"
          className="mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-2.5 text-sm text-bronze-deep"
        >
          {error}
        </p>
      )}

      <footer className="mt-5 flex items-center gap-1 border-t border-line pt-3 text-sm">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked.on}
          aria-label={liked.on ? "Remove your support" : "Support this post"}
          className={`flex items-center gap-1.5 rounded-chip px-3 py-1.5 font-semibold transition ${
            liked.on
              ? "text-blue-action"
              : "text-charcoal-soft hover:text-charcoal"
          }`}
        >
          <svg viewBox="0 0 24 24" fill={liked.on ? "currentColor" : "none"} className="h-[18px] w-[18px]">
            <path
              d="M12 20s-7-4.3-9-8.5C1.6 8.4 3.6 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.4 3.4 4 6.5-2 4.2-9 8.5-9 8.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          {liked.count > 0 ? liked.count : "Support"}
        </button>

        {detail ? (
          <span className="px-3 py-1.5 font-semibold text-charcoal-soft">
            {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
          </span>
        ) : (
          <Link
            href={`/app/community/post/${post.id}`}
            className="rounded-chip px-3 py-1.5 font-semibold text-charcoal-soft transition hover:text-charcoal"
          >
            {post.comment_count > 0
              ? `${post.comment_count} ${post.comment_count === 1 ? "comment" : "comments"}`
              : "Comment"}
          </Link>
        )}

        <span className="flex-1" />

        {mine ? (
          confirmingDelete ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-charcoal-soft">Delete post?</span>
              <button
                className="font-bold text-bronze-deep"
                onClick={onDelete}
                disabled={pending}
              >
                {pending ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                className="font-semibold text-charcoal-soft"
                onClick={() => setConfirmingDelete(false)}
                disabled={pending}
              >
                Keep
              </button>
            </span>
          ) : (
            <span className="flex gap-1 text-xs">
              <button
                className="rounded-chip px-2.5 py-1.5 font-semibold text-charcoal-soft hover:text-charcoal"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="rounded-chip px-2.5 py-1.5 font-semibold text-charcoal-soft hover:text-bronze-deep"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </button>
            </span>
          )
        ) : (
          <button
            className="rounded-chip px-2.5 py-1.5 text-xs font-semibold text-charcoal-soft hover:text-charcoal"
            onClick={() => setReporting(true)}
          >
            Report
          </button>
        )}
      </footer>

      {reporting && (
        <ReportDialog
          targetType="post"
          targetUserId={post.author_id}
          postId={post.id}
          onClose={() => setReporting(false)}
        />
      )}
      </div>
    </article>
  );
}
