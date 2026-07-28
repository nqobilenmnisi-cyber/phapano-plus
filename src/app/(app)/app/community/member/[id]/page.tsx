import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityMemberActions } from "@/components/CommunityMemberActions";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { MemberAvatar } from "@/components/CommunityShared";
import { getMemberProfile, getMyUserId } from "@/lib/community";
import {
  communityChoiceLabel,
  profileHeadline,
  shouldShowBio,
} from "@/lib/community-profile-fields";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { careerStageLabels, streamLabels } from "@/lib/utils";

export const metadata = { title: "Member — Phapano+" };

export default async function CommunityMemberPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured) notFound();
  const uid = await getMyUserId();
  if (!uid) notFound();

  if (params.id === uid) {
    // Your own community identity is managed on the profile page.
    return (
      <main className="mx-auto max-w-2xl px-6 pb-12 pt-7">
        <p className="text-sm text-charcoal-soft">
          This is you!{" "}
          <Link
            href="/app/community/profile"
            className="font-semibold text-blue-action hover:underline"
          >
            Edit your community profile
          </Link>
          .
        </p>
      </main>
    );
  }

  const member = await getMemberProfile(params.id);
  if (!member?.profile) notFound();
  const p = member.profile;
  const headline = profileHeadline(p.headline);
  const pathwayStage = communityChoiceLabel(
    p.stage,
    p.stage_other,
    careerStageLabels
  );
  const psychologyStream = communityChoiceLabel(
    p.stream,
    p.stream_other,
    streamLabels
  );

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <section className="pt-7">
        <Link
          href="/app/community/people"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to people
        </Link>
      </section>

      <section className="card mt-4 p-6">
        <div className="flex items-start gap-4">
          <MemberAvatar name={p.display_name} avatarUrl={p.avatar_url} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-sora text-2xl font-bold tracking-tight">
              {p.display_name}
            </h1>
            {headline && (
              <p className="mt-0.5 break-words text-sm font-semibold text-charcoal">
                {headline}
              </p>
            )}
            <p className="mt-1 text-xs text-charcoal-soft">
              {member.followers} follower{member.followers === 1 ? "" : "s"} ·{" "}
              {member.following} following
            </p>
          </div>
        </div>

        {(pathwayStage || psychologyStream || p.institution) && (
          <dl className="mt-5 grid gap-3 rounded-card border border-line bg-soft p-4 text-sm sm:grid-cols-2">
            {pathwayStage && (
              <div>
                <dt className="text-xs font-semibold text-charcoal-soft">
                  Pathway stage
                </dt>
                <dd className="mt-0.5 text-charcoal">{pathwayStage}</dd>
              </div>
            )}
            {psychologyStream && (
              <div>
                <dt className="text-xs font-semibold text-charcoal-soft">
                  Psychology stream
                </dt>
                <dd className="mt-0.5 text-charcoal">{psychologyStream}</dd>
              </div>
            )}
            {p.institution && (
              <div>
                <dt className="text-xs font-semibold text-charcoal-soft">
                  Institution
                </dt>
                <dd className="mt-0.5 text-charcoal">{p.institution}</dd>
              </div>
            )}
          </dl>
        )}

        {p.bio && shouldShowBio(p.bio) && (
          <section className="mt-5">
            <h2 className="text-sm font-bold text-charcoal">About</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-charcoal">
              {p.bio}
            </p>
          </section>
        )}
        {p.interests.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {p.interests.map((i) => (
              <li
                key={i}
                className="rounded-chip border border-line bg-soft px-2.5 py-1 text-xs font-semibold text-charcoal-soft"
              >
                {i}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <CommunityMemberActions
            userId={p.user_id}
            followedByMe={member.followedByMe}
            blockedByMe={member.blockedByMe}
            displayName={p.display_name}
          />
        </div>
      </section>

      {!member.blockedByMe && (
        <section className="mt-6">
          <h2 className="mb-3 font-sora text-lg font-bold tracking-tight">
            Recent posts
          </h2>
          {member.posts.length === 0 ? (
            <p className="text-sm text-charcoal-soft">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {member.posts.map((post) => (
                <CommunityPostCard key={post.id} post={post} viewerId={uid} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
