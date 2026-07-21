"use client";

import { useState, useTransition } from "react";
import {
  addComment,
  deleteComment,
  editComment,
} from "@/app/(app)/app/community/actions";
import { MemberAvatar, timeAgo } from "@/components/CommunityShared";
import { ReportDialog } from "@/components/ReportDialog";
import { COMMENT_MAX_LENGTH } from "@/lib/community-constants";
import type { CommunityCommentView } from "@/types/database";

export function CommunityComments({
  postId,
  comments,
  viewerId,
  canComment,
}: {
  postId: string;
  comments: CommunityCommentView[];
  viewerId: string;
  canComment: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await addComment(postId, draft);
      if ("error" in result) setError(result.error);
      else setDraft("");
    });
  }

  return (
    <section aria-label="Comments" className="mt-6">
      <h2 className="mb-3 font-sora text-lg font-bold tracking-tight">
        Comments
      </h2>

      {comments.length === 0 && (
        <p className="text-sm text-charcoal-soft">
          No comments yet. Be the first to reply.
        </p>
      )}

      <ul className="space-y-3">
        {comments.map((c) => (
          <CommentRow key={c.id} comment={c} viewerId={viewerId} />
        ))}
      </ul>

      {canComment && (
        <div className="mt-5">
          <label className="sr-only" htmlFor="comment-box">
            Write a comment
          </label>
          <textarea
            id="comment-box"
            className="input min-h-20"
            placeholder="Write a comment…"
            maxLength={COMMENT_MAX_LENGTH}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={pending}
          />
          {error && (
            <p
              aria-live="polite"
              className="mt-2 rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-2.5 text-sm text-bronze-deep"
            >
              {error}
            </p>
          )}
          <button
            className="btn-primary mt-2"
            onClick={send}
            disabled={pending || !draft.trim()}
            aria-busy={pending}
          >
            {pending ? "Sending…" : "Comment"}
          </button>
        </div>
      )}
    </section>
  );
}

function CommentRow({
  comment,
  viewerId,
}: {
  comment: CommunityCommentView;
  viewerId: string;
}) {
  const mine = comment.author_id === viewerId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [reporting, setReporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (gone) return null;
  const name = comment.author?.display_name ?? "Phapano+ member";

  return (
    <li className="rounded-card border border-line bg-paper px-4 py-3">
      <div className="flex items-center gap-2.5">
        <MemberAvatar
          name={name}
          avatarUrl={comment.author?.avatar_url ?? null}
          size={28}
        />
        <span className="min-w-0 truncate text-sm font-semibold text-charcoal">{name}</span>
        <time
          dateTime={comment.created_at}
          className="text-xs text-charcoal-soft"
        >
          {timeAgo(comment.created_at)}
          {comment.edited_at ? " · edited" : ""}
        </time>
        <span className="flex-1" />
        {mine ? (
          confirming ? (
            <span className="flex gap-2 text-xs">
              <button
                className="font-bold text-bronze-deep"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await deleteComment(comment.id);
                    if ("error" in r) setError(r.error);
                    else setGone(true);
                  })
                }
              >
                Delete
              </button>
              <button
                className="font-semibold text-charcoal-soft"
                onClick={() => setConfirming(false)}
              >
                Keep
              </button>
            </span>
          ) : (
            <span className="flex gap-2 text-xs">
              <button
                className="font-semibold text-charcoal-soft hover:text-charcoal"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="font-semibold text-charcoal-soft hover:text-bronze-deep"
                onClick={() => setConfirming(true)}
              >
                Delete
              </button>
            </span>
          )
        ) : (
          <button
            className="text-xs font-semibold text-charcoal-soft hover:text-charcoal"
            onClick={() => setReporting(true)}
          >
            Report
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2">
          <textarea
            className="input min-h-16"
            value={draft}
            maxLength={COMMENT_MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            disabled={pending}
            aria-label="Edit comment"
          />
          <div className="mt-2 flex gap-2">
            <button
              className="btn-secondary"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setDraft(comment.body);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={pending || !draft.trim()}
              onClick={() =>
                startTransition(async () => {
                  const r = await editComment(comment.id, draft);
                  if ("error" in r) setError(r.error);
                  else setEditing(false);
                })
              }
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal">
          {comment.body}
        </p>
      )}

      {error && (
        <p
          aria-live="polite"
          className="mt-2 rounded-chip border border-bronze-soft bg-bronze-soft/40 px-3 py-2 text-xs text-bronze-deep"
        >
          {error}
        </p>
      )}

      {reporting && (
        <ReportDialog
          targetType="comment"
          targetUserId={comment.author_id}
          commentId={comment.id}
          onClose={() => setReporting(false)}
        />
      )}
    </li>
  );
}
