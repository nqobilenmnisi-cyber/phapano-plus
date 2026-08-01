"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
import { postPublicPath } from "@/lib/community-post-url";
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
  const hasImage =
    Boolean(post.image_url) ||
    post.attachments.some((attachment) => attachment.kind === "image");
  const hasMedia = Boolean(post.image_path || post.attachments.length);
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
        <ExpandablePostText
          className="px-3 pb-3 text-sm"
          lines={hasImage ? 2 : 3}
        >
          <CommunityRichText text={post.body} mentions={post.mentions} />
        </ExpandablePostText>
      )}
      {post.image_url && (
        <PostImage
          url={post.image_url}
          alt={post.image_alt_text ?? post.body}
          className="max-h-[38rem] w-full bg-white object-contain"
        />
      )}
      <PostAttachments attachments={post.attachments} caption={post.body} embedded />
      {post.link_url && !hasMedia && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="m-3 flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-paper transition hover:border-blue/30"
        >
          <span className="min-w-0 p-3">
            <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-charcoal-soft">
              {post.link_site_name ?? new URL(post.link_url).hostname} ↗
            </span>
            <span className="mt-1 line-clamp-2 block text-sm font-bold text-charcoal">
              {post.link_title ?? post.link_url}
            </span>
          </span>
        </a>
      )}
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
  const plainCarry = Boolean(post.reshared_post_id && !post.body.trim());
  const interactionPostId = plainCarry
    ? post.reshared_post_id ?? post.id
    : post.id;
  const interactionAuthorName = plainCarry
    ? post.reshared_post?.author?.display_name ?? name
    : name;
  const interactionPath = postPublicPath(interactionPostId, interactionAuthorName);
  const hasImages =
    Boolean(post.image_url) ||
    post.attachments.some((attachment) => attachment.kind === "image");
  const hasAttachments = Boolean(post.image_path || post.attachments.length);

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
      const result = await toggleReaction(interactionPostId, next, actorId);
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
      const result = await passOnPost(interactionPostId, actorId, thoughts);
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
    const url = `${window.location.origin}${postPublicPath(post.id, name)}`;
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
            <ExpandablePostText
              className="mt-3 text-[0.95rem]"
              lines={hasImages ? 2 : 3}
            >
              <CommunityRichText text={post.body} mentions={post.mentions} />
            </ExpandablePostText>
          )
        )}

        {post.reshared_post && <EmbeddedPost post={post.reshared_post} />}

        {post.image_url && (
          <PostImage
            url={post.image_url}
            alt={post.image_alt_text ?? post.body}
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

        {post.link_url && !hasAttachments && (
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
          <DeletePostDialog
            pending={pending}
            onDelete={onDelete}
            onClose={() => setConfirmingDelete(false)}
          />
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

        {(totalReactions > 0 || post.comment_count > 0 || passCount > 0) && (
          <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-b border-line pb-2 text-xs text-charcoal-soft">
            <ReactionSummary counts={reactionCounts} total={totalReactions} />
            <div className="flex min-w-0 flex-wrap justify-end gap-x-3 gap-y-1">
              {post.comment_count > 0 && (
                <Link href={interactionPath} className="hover:underline">
                  {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
                </Link>
              )}
              {passCount > 0 && (
                <span
                  className="inline-flex items-center gap-1"
                  aria-label={`${passCount} carried forward`}
                  title="Carried forward"
                >
                  <PassOnIcon className="h-4 w-4" />
                  <span className="tabular-nums">{passCount}</span>
                </span>
              )}
            </div>
          </div>
        )}

        <footer className="grid grid-cols-4 pt-2 text-xs sm:text-sm">
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
                    className={`group relative grid h-11 w-11 place-items-center rounded-full hover:bg-soft ${
                      reaction === option.value ? "bg-blue-tint" : ""
                    }`}
                    onClick={() => onReact(option.value)}
                  >
                    <ReactionIcon type={option.value} className="h-6 w-6" />
                    <span className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-charcoal px-2 py-1 text-[0.68rem] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {detail ? (
            <span
              className="flex min-h-11 items-center justify-center gap-1 rounded-chip px-1 py-2 font-semibold text-charcoal-soft"
              aria-label={`${post.comment_count} ${post.comment_count === 1 ? "comment" : "comments"}`}
              title="Comment"
            >
              <CommentIcon className="h-5 w-5" />
              {post.comment_count > 0 && <span>{post.comment_count}</span>}
            </span>
          ) : (
            <Link
              href={interactionPath}
              className="flex min-h-11 items-center justify-center gap-1 rounded-chip px-1 py-2 font-semibold text-charcoal-soft transition hover:text-charcoal"
              aria-label={`${post.comment_count} ${post.comment_count === 1 ? "comment" : "comments"}`}
              title="Comment"
            >
              <CommentIcon className="h-5 w-5" />
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
            <PostImage
              key={attachment.id}
              url={attachment.url}
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

function ExpandablePostText({
  children,
  lines,
  className = "",
}: {
  children: ReactNode;
  lines: 2 | 3;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;
    setOverflowing(element.scrollHeight > element.clientHeight + 1);
  }, [children, expanded, lines]);

  return (
    <div className={className}>
      <div
        ref={textRef}
        className={`whitespace-pre-wrap break-words leading-relaxed text-charcoal [overflow-wrap:anywhere] ${
          expanded ? "" : lines === 2 ? "line-clamp-2" : "line-clamp-3"
        }`}
      >
        {children}
      </div>
      {(overflowing || expanded) && (
        <button
          type="button"
          className="mt-0.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal hover:underline"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "… more"}
        </button>
      )}
    </div>
  );
}

function imageExtension(contentType: string): string {
  const extensions: Record<string, string> = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[contentType.split(";")[0].trim().toLowerCase()] ?? "jpg";
}

async function saveImageDirectly(url: string) {
  const response = await fetch(url, { credentials: "omit" });
  if (!response.ok) throw new Error("Image download failed");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `phapano-image-${new Date().toISOString().slice(0, 10)}.${imageExtension(
    blob.type || response.headers.get("content-type") || ""
  )}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

function PostImage({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const cover = className.includes("object-cover");
  return (
    <>
      <button
        type="button"
        className={`block cursor-zoom-in overflow-hidden ${className}`}
        aria-label="View image"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className={cover ? "h-full w-full object-cover" : "h-auto w-full object-contain"}
          style={{ maxHeight: "inherit" }}
        />
      </button>
      {open && (
        <ImageLightbox url={url} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ImageLightbox({
  url,
  alt,
  onClose,
}: {
  url: string;
  alt: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setDownloadError(null);
    try {
      await saveImageDirectly(url);
    } catch {
      setDownloadError("The image could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Post image"
      className="fixed inset-0 z-[100] flex flex-col bg-charcoal/95 p-3 sm:p-6"
    >
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-h-11 items-center rounded-chip bg-white px-4 py-2 text-sm font-bold text-blue-deep disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save image"}
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold text-charcoal"
          aria-label="Close image"
        >
          ×
        </button>
      </div>
      {downloadError && (
        <p role="alert" className="mt-2 text-right text-sm font-semibold text-white">
          {downloadError}
        </p>
      )}
      <div className="flex min-h-0 flex-1 items-center justify-center py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="max-h-full max-w-full object-contain" />
      </div>
    </div>,
    document.body
  );
}

function DeletePostDialog({
  pending,
  onDelete,
  onClose,
}: {
  pending: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
      if (event.key !== "Tab") return;
      const buttons = Array.from(
        dialogRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not([disabled])"
        ) ?? []
      );
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-charcoal/35 p-4 backdrop-blur-[2px]">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-post-title"
        aria-describedby="delete-post-description"
        className="w-full max-w-sm rounded-card border border-line bg-paper p-5 shadow-2xl"
      >
        <h2 id="delete-post-title" className="font-sora text-lg font-bold">
          Delete this post?
        </h2>
        <p id="delete-post-description" className="mt-2 text-sm text-charcoal-soft">
          This removes the post and its uploaded media. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={pending}
          >
            Keep post
          </button>
          <button
            type="button"
            className="btn-bronze"
            onClick={onDelete}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete post"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ReactionSummary({
  counts,
  total,
}: {
  counts: Record<CommunityReactionType, number>;
  total: number;
}) {
  if (!total) return <span />;
  const active = COMMUNITY_REACTIONS.filter((reaction) => counts[reaction.value] > 0);
  return (
    <span
      className="flex items-center"
      aria-label={`${total} ${total === 1 ? "reaction" : "reactions"}`}
      title={active.map((reaction) => `${reaction.label}: ${counts[reaction.value]}`).join(", ")}
    >
      <span className="flex -space-x-1">
        {active.map((reaction) => (
          <span
            key={reaction.value}
            className="grid h-5 w-5 place-items-center rounded-full border border-white bg-blue-tint text-blue-deep"
          >
            <ReactionIcon type={reaction.value} className="h-3.5 w-3.5" />
          </span>
        ))}
      </span>
      <span className="ml-1.5 tabular-nums">{total}</span>
    </span>
  );
}
