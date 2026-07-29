"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  deletePost,
  passOnPost,
  toggleReaction,
  updatePost,
} from "@/app/(app)/app/community/actions";
import { MemberAvatar, timeAgo } from "@/components/CommunityShared";
import { CommunityRichText } from "@/components/CommunityRichText";
import {
  CelebrateIcon,
  CommentIcon,
  HeartIcon,
  LightbulbIcon,
  PassOnIcon,
  SendIcon,
} from "@/components/PhapanoIcons";
import { ReportDialog } from "@/components/ReportDialog";
import { VerificationBadges } from "@/components/VerificationBadges";
import { POST_MAX_LENGTH } from "@/lib/community-constants";
import {
  COMMUNITY_REACTIONS,
} from "@/lib/community-posts";
import type {
  CommunityEmbeddedPost,
  CommunityPostAttachmentView,
  CommunityPostView,
  CommunityReactionType,
} from "@/types/database";

function ReactionIcon({
  type,
  className = "h-5 w-5",
}: {
  type: CommunityReactionType;
  className?: string;
}) {
  if (type === "celebrate") return <CelebrateIcon className={className} />;
  if (type === "insightful") return <LightbulbIcon className={className} />;
  return <HeartIcon className={className} />;
}

function EmbeddedPost({ post }: { post: CommunityEmbeddedPost }) {
  const name = post.author?.display_name ?? "Phapano+ member";
  return (
    <div className="mt-3 overflow-hidden rounded-card border border-line bg-soft/50">
      <div className="flex items-center gap-2.5 p-3">
        <MemberAvatar
          name={name}
          avatarUrl={post.author?.avatar_url ?? null}
          size={30}
        />
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1 text-sm font-bold text-charcoal">
            <span className="truncate">{name}</span>
            <VerificationBadges
              badges={post.verification_badges}
              officialOrganisation={post.is_official}
            />
          </p>
          <p className="text-xs text-charcoal-soft">{timeAgo(post.created_at)}</p>
        </div>
      </div>
      {post.body && (
        <p className="whitespace-pre-wrap break-words px-3 pb-3 text-sm leading-relaxed text-charcoal [overflow-wrap:anywhere]">
          <CommunityRichText text={post.body} mentions={post.mentions} />
        </p>
      )}
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt={post.image_alt_text ?? ""}
          className="max-h-[38rem] w-full object-contain bg-white"
        />
      )}
      <PostAttachments attachments={post.attachments} caption={post.body} embedded />
    </div>
  );
}

export function CommunityPostCard({
  post,
  viewerId,
  detail = false,
  postingIdentities,
}: {
  post: CommunityPostView;
  viewerId: string;
  detail?: boolean;
  postingIdentities?: { id: string; name: string }[];
}) {
  const mine = post.can_manage;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [reporting, setReporting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reaction, setReaction] = useState<CommunityReactionType | null>(
    post.my_reaction
  );
  const [reactionCounts, setReactionCounts] = useState(post.reaction_counts);
  const [passed, setPassed] = useState(post.passed_by_me);
  const [passCount, setPassCount] = useState(post.pass_count);
  const [message, setMessage] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const identities =
    postingIdentities?.length
      ? postingIdentities
      : [{ id: viewerId, name: "Your profile" }];
  const [actorId, setActorId] = useState(viewerId);
  const [carryMenuOpen, setCarryMenuOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quote, setQuote] = useState("");
  const [pending, startTransition] = useTransition();

  if (deleted) return null;

  const name = post.author?.display_name ?? "Phapano+ member";
  const totalReactions = Object.values(reactionCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const activeReaction = COMMUNITY_REACTIONS.find(
    (option) => option.value === reaction
  );

  function onReact(nextType: CommunityReactionType) {
    const next = reaction === nextType ? null : nextType;
    const previous = reaction;
    setReaction(next);
    setReactionCounts((counts) => {
      const updated = { ...counts };
      if (previous) updated[previous] = Math.max(0, updated[previous] - 1);
      if (next) updated[next] += 1;
      return updated;
    });
    setReactionOpen(false);
    startTransition(async () => {
      const result = await toggleReaction(post.id, next, actorId);
      if ("error" in result) setMessage(result.error);
    });
  }

  function saveEdit() {
    startTransition(async () => {
      const result = await updatePost(post.id, draft);
      if ("error" in result) setMessage(result.error);
      else setEditing(false);
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deletePost(post.id);
      if ("error" in result) setMessage(result.error);
      else setDeleted(true);
    });
  }

  function onCarry(thoughts = "") {
    if (passed) {
      setMessage("This identity has already carried the post forward.");
      return;
    }
    setPassed(true);
    setPassCount((count) => count + 1);
    startTransition(async () => {
      const result = await passOnPost(post.id, actorId, thoughts);
      if ("error" in result) {
        setPassed(false);
        setPassCount((count) => Math.max(0, count - 1));
        setMessage(result.error);
      } else {
        setQuote("");
        setQuoteOpen(false);
        setCarryMenuOpen(false);
      }
    });
  }

  async function sharePost() {
    const url = `${window.location.origin}/app/community/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} on Phapano+`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Post link copied.");
      }
    } catch {
      // Closing the native share sheet is not an error for the user.
    }
  }

  return (
    <article className="card overflow-hidden border-line/90 bg-paper shadow-[0_8px_28px_rgba(29,45,64,0.06)]">
      <div className="p-4 sm:p-5">
        <header className="flex items-start gap-3">
          <Link
            href={`/app/community/member/${post.author_id}`}
            aria-label={`View ${name}'s profile`}
          >
            <MemberAvatar name={name} avatarUrl={post.author?.avatar_url ?? null} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="flex min-w-0 max-w-full items-center gap-1">
                <Link
                  href={`/app/community/member/${post.author_id}`}
                  className="truncate font-semibold text-charcoal hover:underline"
                >
                  {name}
                </Link>
                <VerificationBadges
                  badges={post.verification_badges}
                  officialOrganisation={post.is_official}
                />
              </span>
            </div>
            <p className="text-xs text-charcoal-soft">
              {post.reshared_post_id ? "Carried forward · " : ""}
              {post.author?.headline ? `${post.author.headline} · ` : ""}
              <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
              {post.edited_at ? " · edited" : ""}
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="Post options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-charcoal-soft hover:bg-soft hover:text-charcoal"
            >
              ···
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-40 rounded-card border border-line bg-paper p-1 shadow-lg">
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-soft"
                  onClick={() => {
                    setMenuOpen(false);
                    void sharePost();
                  }}
                >
                  Copy or share link
                </button>
                {mine ? (
                  <>
                    <button
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-soft"
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                    >
                      Edit post
                    </button>
                    <button
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-bronze-deep hover:bg-soft"
                      onClick={() => {
                        setConfirmingDelete(true);
                        setMenuOpen(false);
                      }}
                    >
                      Delete post
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-soft"
                    onClick={() => {
                      setReporting(true);
                      setMenuOpen(false);
                    }}
                  >
                    Report post
                  </button>
                )}
              </div>
            )}
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
              onChange={(event) => setDraft(event.target.value)}
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
          post.body && (
            <p className="mt-3 whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-charcoal [overflow-wrap:anywhere]">
              <CommunityRichText text={post.body} mentions={post.mentions} />
            </p>
          )
        )}

        {post.reshared_post && <EmbeddedPost post={post.reshared_post} />}

        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt={post.image_alt_text ?? ""}
            className="-mx-4 mt-4 max-h-[42rem] w-[calc(100%+2rem)] bg-soft object-contain sm:-mx-5 sm:w-[calc(100%+2.5rem)]"
          />
        )}
        <PostAttachments attachments={post.attachments} caption={post.body} />
        {mine && post.media_status === "pending" && (
          <p className="mt-3 rounded-card bg-blue-tint px-3 py-2 text-xs font-semibold text-blue-deep">
            Your image is private while it completes moderator review. The
            caption is already published.
          </p>
        )}
        {mine && post.media_status === "removed" && (
          <p className="mt-3 rounded-card bg-bronze-soft/40 px-3 py-2 text-xs font-semibold text-bronze-deep">
            The image was removed by moderation. Your caption remains visible.
          </p>
        )}

        {post.link_url && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-soft/50 transition hover:border-blue/30 sm:flex-row"
          >
            {post.link_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.link_image_url}
                alt=""
                className="h-36 w-full shrink-0 object-cover sm:h-24 sm:w-28"
              />
            )}
            <span className="min-w-0 p-3">
              <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-charcoal-soft">
                {post.link_site_name ?? new URL(post.link_url).hostname} ↗
              </span>
              <span className="mt-1 line-clamp-2 block text-sm font-bold text-charcoal">
                {post.link_title ?? post.link_url}
              </span>
              {post.link_description && (
                <span className="mt-1 line-clamp-2 block text-xs text-charcoal-soft">
                  {post.link_description}
                </span>
              )}
            </span>
          </a>
        )}

        {message && (
          <p
            aria-live="polite"
            className="mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-2.5 text-sm text-bronze-deep"
          >
            {message}
          </p>
        )}

        {confirmingDelete && (
          <div className="mt-3 flex items-center justify-end gap-3 rounded-card bg-soft p-3 text-sm">
            <span className="text-charcoal-soft">Delete this post?</span>
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
          </div>
        )}

        {identities.length > 1 && (
          <label className="mt-4 flex items-center justify-end gap-2 text-xs font-semibold text-charcoal-soft">
            Interacting as
            <select
              className="max-w-[12rem] rounded-chip border border-line bg-paper px-2 py-1.5 font-bold text-charcoal"
              value={actorId}
              onChange={(event) => {
                setActorId(event.target.value);
                setReaction(null);
                setPassed(false);
              }}
              disabled={pending}
            >
              {identities.map((identity) => (
                <option key={identity.id} value={identity.id}>
                  {identity.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {quoteOpen && (
          <div className="mt-3 rounded-card border border-line bg-soft p-3">
            <label className="label" htmlFor={`carry-thoughts-${post.id}`}>
              Add your thoughts
            </label>
            <textarea
              id={`carry-thoughts-${post.id}`}
              className="input mt-1 min-h-20"
              value={quote}
              maxLength={POST_MAX_LENGTH}
              onChange={(event) => setQuote(event.target.value)}
              placeholder="Why are you carrying this forward?"
              disabled={pending}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary !py-2 text-sm"
                onClick={() => setQuoteOpen(false)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary !py-2 text-sm"
                onClick={() => onCarry(quote)}
                disabled={pending || !quote.trim()}
              >
                Carry forward
              </button>
            </div>
          </div>
        )}

        <footer className="mt-5 grid grid-cols-4 border-t border-line pt-2 text-xs sm:text-sm">
          <div className="relative">
            <button
              type="button"
              onClick={() => setReactionOpen((open) => !open)}
              aria-pressed={Boolean(reaction)}
              title={activeReaction?.label ?? "React"}
              aria-label={
                totalReactions
                  ? `${activeReaction?.label ?? "React"}, ${totalReactions} reactions`
                  : activeReaction?.label ?? "React"
              }
              className={`flex min-h-11 w-full items-center justify-center gap-1 rounded-chip px-1 py-2 font-semibold transition ${
                reaction
                  ? "text-blue-action"
                  : "text-charcoal-soft hover:text-charcoal"
              }`}
            >
              {reaction ? (
                <ReactionIcon type={reaction} />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              {totalReactions > 0 && <span>{totalReactions}</span>}
            </button>
            {reactionOpen && (
              <div className="absolute bottom-full left-0 z-20 mb-2 flex rounded-full border border-line bg-paper p-1 shadow-lg">
                {COMMUNITY_REACTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={reaction === option.value}
                    className={`grid h-11 w-11 place-items-center rounded-full hover:bg-soft ${
                      reaction === option.value ? "bg-blue-tint" : ""
                    }`}
                    onClick={() => onReact(option.value)}
                  >
                    <ReactionIcon type={option.value} className="h-6 w-6" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {detail ? (
            <span
              className="flex min-h-11 items-center justify-center gap-1 rounded-chip px-1 py-2 font-semibold text-charcoal-soft"
              aria-label={`${post.comment_count} comments`}
              title="Comment"
            >
              <CommentIcon className="h-5 w-5" />
              {post.comment_count > 0 && <span>{post.comment_count}</span>}
            </span>
          ) : (
            <Link
              href={`/app/community/post/${post.id}`}
              className="flex min-h-11 items-center justify-center gap-1 rounded-chip px-1 py-2 font-semibold text-charcoal-soft transition hover:text-charcoal"
              aria-label={`${post.comment_count} comments`}
              title="Comment"
            >
              <CommentIcon className="h-5 w-5" />
              {post.comment_count > 0 && <span>{post.comment_count}</span>}
            </Link>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setCarryMenuOpen((open) => !open)}
              disabled={pending}
              aria-pressed={passed}
              className={`flex min-h-11 w-full items-center justify-center gap-1 rounded-chip px-1 py-2 font-semibold transition ${
                passed ? "text-blue-action" : "text-charcoal-soft hover:text-charcoal"
              }`}
              aria-label={
                passCount
                  ? `Carry forward, ${passCount} carried forwards`
                  : "Carry forward"
              }
              title="Carry forward"
            >
              <PassOnIcon className="h-5 w-5" />
              {passCount > 0 && <span>{passCount}</span>}
            </button>
            {carryMenuOpen && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-56 rounded-card border border-line bg-paper p-1 shadow-lg">
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-soft"
                  onClick={() => onCarry()}
                >
                  Carry forward
                  <span className="mt-0.5 block text-xs font-normal text-charcoal-soft">
                    Share the original post as it is
                  </span>
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-soft"
                  onClick={() => {
                    setQuoteOpen(true);
                    setCarryMenuOpen(false);
                  }}
                >
                  Carry forward with thoughts
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void sharePost()}
            className="flex min-h-11 items-center justify-center rounded-chip px-1 py-2 font-semibold text-charcoal-soft transition hover:text-charcoal"
            aria-label="Send post"
            title="Send"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </footer>

        {totalReactions > 0 && (
          <p className="mt-2 text-xs text-charcoal-soft">
            {COMMUNITY_REACTIONS.filter(
              (option) => reactionCounts[option.value] > 0
            )
              .map(
                (option) =>
                  `${option.label} ${reactionCounts[option.value]}`
              )
              .join(" · ")}
          </p>
        )}

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

function PostAttachments({
  attachments,
  caption,
  embedded = false,
}: {
  attachments: CommunityPostAttachmentView[];
  caption: string;
  embedded?: boolean;
}) {
  if (!attachments.length) return null;
  const images = attachments.filter((attachment) => attachment.kind === "image");
  const pdf = attachments.find((attachment) => attachment.kind === "pdf");
  return (
    <div
      className={`mt-4 ${embedded ? "" : "-mx-4 sm:-mx-5"}`}
      aria-label="Post attachments"
    >
      {images.length > 0 && (
        <div
          className={`grid gap-0.5 bg-line ${
            images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {images.map((attachment, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={attachment.id}
              src={attachment.url}
              alt={caption || `Image ${index + 1} attached to this post`}
              className={`w-full bg-soft object-cover ${
                images.length === 1
                  ? "max-h-[42rem] object-contain"
                  : images.length === 3 && index === 0
                    ? "row-span-2 h-full min-h-80"
                    : "h-52"
              }`}
            />
          ))}
        </div>
      )}
      {pdf && (
        <a
          href={pdf.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 border-y border-line bg-soft p-4 transition hover:bg-blue-tint/40"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-card bg-paper text-xs font-extrabold text-blue-deep shadow-sm">
            PDF
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-charcoal">Open PDF attachment</span>
            <span className="text-xs text-charcoal-soft">
              {(pdf.size_bytes / 1024 / 1024).toFixed(1)} MB · opens securely
            </span>
          </span>
          <span aria-hidden="true" className="text-blue-action">↗</span>
        </a>
      )}
    </div>
  );
}
