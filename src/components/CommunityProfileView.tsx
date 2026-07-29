import Link from "next/link";
import { CommunityMemberActions } from "@/components/CommunityMemberActions";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { MemberAvatar } from "@/components/CommunityShared";
import { VerificationBadges } from "@/components/VerificationBadges";
import {
  communityChoiceLabel,
  orcidProfileUrl,
  profileHeadline,
  safeExternalProfileUrl,
  shouldShowBio,
} from "@/lib/community-profile-fields";
import type {
  CommunityConnectionState,
  CommunityPostView,
  CommunityProfile,
  ProfileVerificationBadge,
} from "@/types/database";
import {
  careerStageLabels,
  professionalCategoryLabels,
  streamLabels,
} from "@/lib/utils";

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
  verificationBadges?: ProfileVerificationBadge[];
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
  verificationBadges = [],
}: CommunityProfileViewProps) {
  const headline = profileHeadline(profile.headline);
  const pathwayStage = communityChoiceLabel(
    profile.stage,
    profile.stage_other,
    careerStageLabels
  );
  const psychologyInterests = profile.interests.map(
    (interest) =>
      communityChoiceLabel(interest, null, streamLabels) ?? interest
  );
  const professionalCategory = communityChoiceLabel(
    profile.professional_category,
    profile.professional_category_other,
    professionalCategoryLabels
  );
  const experience = [
    { label: "Skills", value: profile.skills },
    { label: "Volunteering", value: profile.volunteering },
    { label: "Workshops", value: profile.workshops },
  ].filter((item) => Boolean(item.value?.trim()));
  const professionalLinks = [
    {
      label: "LinkedIn",
      href: safeExternalProfileUrl(profile.linkedin_url),
    },
    {
      label: "Website",
      href: safeExternalProfileUrl(profile.website_url),
    },
    {
      label: "Google Scholar",
      href: safeExternalProfileUrl(profile.scholar_url),
    },
    {
      label: "ResearchGate",
      href: safeExternalProfileUrl(profile.researchgate_url),
    },
    { label: "ORCID", href: orcidProfileUrl(profile.orcid) },
  ].filter((link): link is { label: string; href: string } =>
    Boolean(link.href)
  );

  return (
    <>
      <section className="card mt-4 overflow-hidden">
        <div
          className="h-24 bg-gradient-to-br from-blue-tint via-[#e8f4ff] to-bronze-soft/50 sm:h-28"
          aria-hidden="true"
        />
        <div className="-mt-12 px-5 pb-6 sm:px-7">
          <div className="flex items-end justify-between gap-4">
            <div className="rounded-full bg-white p-1.5 shadow-card">
              <MemberAvatar
                name={profile.display_name}
                avatarUrl={profile.avatar_url}
                size={92}
              />
            </div>
            {isOwnProfile && (
              <Link
                href="/app/profile?section=community#community-settings"
                className="btn-secondary mb-1 inline-flex !px-4 !py-2 text-sm"
              >
                Edit profile
              </Link>
            )}
          </div>

          <div className="mt-4">
            {isOwnProfile ? (
              <h2 className="break-words font-sora text-2xl font-bold tracking-tight sm:text-3xl">
                {profile.display_name}
              </h2>
            ) : (
              <h1 className="break-words font-sora text-2xl font-bold tracking-tight sm:text-3xl">
                {profile.display_name}
              </h1>
            )}
            {verificationBadges.length > 0 && (
              <div className="mt-2">
                <VerificationBadges badges={verificationBadges} />
              </div>
            )}
            {pathwayStage && (
              <p className="mt-1 break-words text-sm font-bold text-blue-deep">
                {pathwayStage}
              </p>
            )}
            {professionalCategory && (
              <p className="mt-1 break-words text-sm font-semibold text-charcoal-soft">
                {professionalCategory}
              </p>
            )}
            {headline && (
              <p className="mt-2 break-words text-[0.95rem] font-semibold leading-snug text-charcoal">
                {headline}
              </p>
            )}
            {shouldShowBio(profile.bio) && (
              <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-charcoal-soft">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-card border border-line bg-soft/70 py-3">
            <ProfileStat
              value={followers}
              label={followers === 1 ? "Follower" : "Followers"}
              href={isOwnProfile ? "/app/community/people" : undefined}
            />
            <ProfileStat
              value={following}
              label="Following"
              href={isOwnProfile ? "/app/community/people" : undefined}
            />
            <ProfileStat
              value={connections}
              label={connections === 1 ? "Connection" : "Connections"}
              href={isOwnProfile ? "/app/community/connections" : undefined}
            />
          </div>

          {!isOwnProfile && (
            <div className="mt-4">
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
            </div>
          )}

          {(profile.institution ||
            profile.province ||
            psychologyInterests.length > 0) && (
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-charcoal-soft">
                About
              </h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                {profile.institution && (
                  <ProfileDetail label="University" value={profile.institution} />
                )}
                {profile.province && (
                  <ProfileDetail label="Province" value={profile.province} />
                )}
              </dl>
              {psychologyInterests.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {psychologyInterests.map((interest) => (
                    <li
                      key={interest}
                      className="rounded-chip border border-blue/30 bg-white px-3 py-1.5 text-xs font-semibold text-blue-deep"
                    >
                      {interest}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {experience.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-charcoal-soft">
                Experience &amp; skills
              </h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {experience.map((item) => (
                  <ProfileDetail
                    key={item.label}
                    label={item.label}
                    value={item.value!}
                  />
                ))}
              </dl>
            </div>
          )}

          {profile.experience.length > 0 && (
            <ProfileHistory
              title="Experience"
              entries={profile.experience.map((entry) => ({
                id: entry.id,
                title: entry.title,
                subtitle: entry.organisation,
                meta: historyDateRange(
                  entry.start_date,
                  entry.end_date,
                  entry.current,
                  true
                ),
                secondary: entry.location,
                description: entry.description,
              }))}
            />
          )}

          {profile.education.length > 0 && (
            <ProfileHistory
              title="Education"
              entries={profile.education.map((entry) => ({
                id: entry.id,
                title: entry.institution,
                subtitle: [entry.qualification, entry.field_of_study]
                  .filter(Boolean)
                  .join(" · "),
                meta: historyDateRange(
                  entry.start_year,
                  entry.end_year,
                  entry.current,
                  false
                ),
                secondary: "",
                description: entry.description,
              }))}
            />
          )}

          {professionalLinks.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-charcoal-soft">
                Professional links
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {professionalLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-chip border border-blue/30 bg-white px-3 py-1.5 text-xs font-bold text-blue-deep transition hover:border-blue-action"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {!blockedByMe && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between border-b border-line">
            <h2 className="border-b-2 border-blue-action px-1 pb-3 font-sora text-base font-bold tracking-tight text-charcoal">
              Posts
            </h2>
            <span className="pb-3 text-xs font-semibold text-charcoal-soft">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>
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

type ProfileHistoryItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  secondary: string;
  description: string;
};

function ProfileHistory({
  title,
  entries,
}: {
  title: string;
  entries: ProfileHistoryItem[];
}) {
  return (
    <section className="mt-6 border-t border-line pt-5">
      <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-charcoal-soft">
        {title}
      </h3>
      <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-white px-4">
        {entries.map((entry) => (
          <li key={entry.id} className="py-4 first:pt-4 last:pb-4">
            <p className="font-sora text-sm font-bold text-charcoal">
              {entry.title}
            </p>
            {entry.subtitle && (
              <p className="mt-1 text-sm font-semibold text-charcoal">
                {entry.subtitle}
              </p>
            )}
            {(entry.meta || entry.secondary) && (
              <p className="mt-1 text-xs text-charcoal-soft">
                {[entry.meta, entry.secondary].filter(Boolean).join(" · ")}
              </p>
            )}
            {entry.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal-soft">
                {entry.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function historyDateRange(
  start: string,
  end: string,
  current: boolean,
  monthPrecision: boolean
) {
  const format = (value: string) => {
    if (!value) return "";
    if (!monthPrecision) return value;
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return value;
    return new Intl.DateTimeFormat("en-ZA", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  };
  return [format(start), current ? "Present" : format(end)]
    .filter(Boolean)
    .join(" – ");
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-soft px-4 py-3">
      <dt className="text-xs font-semibold text-charcoal-soft">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-charcoal">
        {value}
      </dd>
    </div>
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
    <span className="flex flex-col items-center px-1 text-center">
      <span className="font-sora text-lg font-bold text-charcoal">{value}</span>
      <span className="mt-0.5 text-[0.68rem] font-semibold text-charcoal-soft sm:text-xs">
        {label}
      </span>
    </span>
  );

  return href ? (
    <Link href={href} className="block hover:underline">
      {content}
    </Link>
  ) : (
    content
  );
}
