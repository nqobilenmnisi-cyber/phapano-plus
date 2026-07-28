import Link from "next/link";
import { CommunityMemberActions } from "@/components/CommunityMemberActions";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { MemberAvatar } from "@/components/CommunityShared";
import {
  communityChoiceLabel,
  profileHeadline,
  shouldShowBio,
} from "@/lib/community-profile-fields";
import type {
  CommunityConnectionState,
  CommunityPostView,
  CommunityProfile,
} from "@/types/database";
import { careerStageLabels, streamLabels } from "@/lib/utils";

type CommunityProfileViewProps = {
  profile: CommunityProfile;
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
  viewerId: string;
  isOwnProfile?: boolean;
};

export function CommunityProfileView({
  profile,
  followers,
  following,
  connections,
  followedByMe,
  blockedByMe,
  connectionId,
  connectionState,
  connectionNote,
  canConnect,
  posts,
  viewerId,
  isOwnProfile = false,
}: CommunityProfileViewProps) {
  const headline = profileHeadline(profile.headline);
  const pathwayStage = communityChoiceLabel(
    profile.stage,
    profile.stage_other,
    careerStageLabels
  );
  const psychologyStream = communityChoiceLabel(
    profile.stream,
    profile.stream_other,
    streamLabels
  );

  return (
    <>
      <section className="card mt-4 p-6">
        <div className="flex items-start gap-4">
          <MemberAvatar
            name={profile.display_name}
            avatarUrl={profile.avatar_url}
            size={72}
          />
          <div className="min-w-0 flex-1">
            {isOwnProfile ? (
              <h2 className="break-words font-sora text-2xl font-bold tracking-tight">
                {profile.display_name}
              </h2>
            ) : (
              <h1 className="break-words font-sora text-2xl font-bold tracking-tight">
                {profile.display_name}
              </h1>
            )}
            {pathwayStage && (
              <p className="mt-1 break-words text-sm font-semibold text-charcoal-soft">
                {pathwayStage}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <ProfileStat
                value={followers}
                label={followers === 1 ? "follower" : "followers"}
                href={isOwnProfile ? "/app/community/people" : undefined}
              />
              <ProfileStat
                value={following}
                label="following"
                href={isOwnProfile ? "/app/community/people" : undefined}
              />
              <ProfileStat
                value={connections}
                label={connections === 1 ? "connection" : "connections"}
                href={
                  isOwnProfile ? "/app/community/connections" : undefined
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          {isOwnProfile ? (
            <Link
              href="/app/community/profile/edit"
              className="btn-secondary inline-flex !px-4 !py-2 text-sm"
            >
              Edit profile
            </Link>
          ) : (
            <CommunityMemberActions
              userId={profile.user_id}
              followedByMe={followedByMe}
              blockedByMe={blockedByMe}
              displayName={profile.display_name}
              connectionId={connectionId}
              connectionState={connectionState}
              connectionNote={connectionNote}
              canConnect={canConnect}
            />
          )}
        </div>

        {(headline || shouldShowBio(profile.bio)) && (
          <div className="mt-5">
            {headline && (
              <p className="break-words text-sm font-bold text-charcoal">
                {headline}
              </p>
            )}
            {shouldShowBio(profile.bio) && (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-charcoal">
                {profile.bio}
              </p>
            )}
          </div>
        )}

        {(psychologyStream || profile.institution) && (
          <dl className="mt-5 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
            {psychologyStream && (
              <div>
                <dt className="text-xs font-semibold text-charcoal-soft">
                  Psychology stream
                </dt>
                <dd className="mt-0.5 text-charcoal">{psychologyStream}</dd>
              </div>
            )}
            {profile.institution && (
              <div>
                <dt className="text-xs font-semibold text-charcoal-soft">
                  Institution
                </dt>
                <dd className="mt-0.5 text-charcoal">
                  {profile.institution}
                </dd>
              </div>
            )}
          </dl>
        )}

        {profile.interests.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {profile.interests.map((interest) => (
              <li
                key={interest}
                className="rounded-chip border border-line bg-soft px-2.5 py-1 text-xs font-semibold text-charcoal-soft"
              >
                {interest}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!blockedByMe && (
        <section className="mt-6">
          <h2 className="mb-3 font-sora text-lg font-bold tracking-tight">
            Recent posts
          </h2>
          {posts.length === 0 ? (
            <p className="text-sm text-charcoal-soft">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  viewerId={viewerId}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function ProfileStat({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="font-bold text-charcoal">{value}</span>{" "}
      <span className="text-charcoal-soft">{label}</span>
    </>
  );

  return href ? (
    <Link href={href} className="hover:underline">
      {content}
    </Link>
  ) : (
    <span>{content}</span>
  );
}
