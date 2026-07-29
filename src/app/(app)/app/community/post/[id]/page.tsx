import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityComments } from "@/components/CommunityComments";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import {
  getComments,
  getMyModerationState,
  getMyUserId,
  getPostView,
  hasAcceptedGuidelines,
} from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Post | Phapano+" };

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) notFound();
  const { id } = await params;

  const [uid, post] = await Promise.all([
    getMyUserId(),
    getPostView(id),
  ]);
  if (!post || !uid) notFound();

  const [comments, accepted, moderation] = await Promise.all([
    getComments(post.id),
    hasAcceptedGuidelines(),
    getMyModerationState(),
  ]);
  const canParticipate =
    !moderation.posting_restricted && !moderation.community_suspended;

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <section className="pt-7">
        <Link
          href="/app/community"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to community
        </Link>
      </section>
      <div className="mt-4">
        <CommunityPostCard post={post} viewerId={uid} detail />
      </div>
      <CommunityComments
        postId={post.id}
        comments={comments}
        viewerId={uid}
        canParticipate={canParticipate}
        acceptedGuidelines={accepted}
      />
    </main>
  );
}
