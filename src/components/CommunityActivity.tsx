"use client";

import Link from "next/link";
import { useState } from "react";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { timeAgo } from "@/components/CommunityShared";
import type {
  CommunityActivityComment,
  CommunityPostView,
} from "@/types/database";

type ActivityTab = "posts" | "carried" | "comments" | "reactions" | "media";

export function CommunityActivity({
  posts,
  reactions,
  comments,
  viewerId,
}: {
  posts: CommunityPostView[];
  reactions: CommunityPostView[];
  comments: CommunityActivityComment[];
  viewerId: string;
}) {
  const [tab, setTab] = useState<ActivityTab>("posts");
  const originalPosts = posts.filter((post) => !post.reshared_post_id);
  const carried = posts.filter((post) => Boolean(post.reshared_post_id));
  const media = originalPosts.filter(
    (post) => Boolean(post.image_url) || post.attachments.length > 0
  );
  const tabs: { id: ActivityTab; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "carried", label: "Carried forward" },
    { id: "comments", label: "Comments" },
    { id: "reactions", label: "Reactions" },
    { id: "media", label: "Media" },
  ];
  const visiblePosts =
    tab === "posts"
      ? originalPosts
      : tab === "carried"
        ? carried
        : tab === "reactions"
          ? reactions
          : tab === "media"
            ? media
            : [];

  return (
    <div>
      <h2 className="mb-2 font-sora text-lg font-bold tracking-tight text-charcoal">
        Activity
      </h2>
      <div className="-mx-1 overflow-x-auto pb-1">
        <div role="tablist" aria-label="Your Community activity" className="flex min-w-max border-b border-line px-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`border-b-2 px-3 py-3 text-sm font-bold transition ${
                tab === item.id
                  ? "border-blue-action text-blue-deep"
                  : "border-transparent text-charcoal-soft hover:text-charcoal"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "comments" ? (
        comments.length ? (
          <ul className="mt-3 space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="card p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal">
                  {comment.body}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-charcoal-soft">
                  <time dateTime={comment.created_at}>{timeAgo(comment.created_at)}</time>
                  <Link href={`/app/community/post/${comment.post_id}`} className="font-bold text-blue-action hover:underline">
                    View conversation
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState text="Your Community comments will appear here." />
        )
      ) : visiblePosts.length ? (
        <div className="mt-3 space-y-3">
          {visiblePosts.map((post) => (
            <CommunityPostCard key={`${tab}-${post.id}`} post={post} viewerId={viewerId} />
          ))}
        </div>
      ) : (
        <EmptyState
          text={
            tab === "posts"
              ? "Your original posts will appear here."
              : tab === "carried"
                ? "Posts you carry forward will appear here."
                : tab === "reactions"
                  ? "Posts you react to will appear here."
                  : "Images and PDFs you upload will appear here."
          }
        />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-card border border-dashed border-line bg-soft/50 px-5 py-7 text-center text-sm text-charcoal-soft">
      {text}
    </p>
  );
}
