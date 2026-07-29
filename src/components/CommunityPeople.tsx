"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/(app)/app/community/actions";
import { MemberAvatar } from "@/components/CommunityShared";
import { VerificationBadges } from "@/components/VerificationBadges";
import type { CommunityMemberCard } from "@/types/database";

type Tab = "discover" | "followers" | "following";

export function CommunityPeople({
  initialMembers,
  followers,
  following,
}: {
  initialMembers: CommunityMemberCard[];
  followers: CommunityMemberCard[];
  following: CommunityMemberCard[];
}) {
  const [tab, setTab] = useState<Tab>("discover");
  const tabs: { id: Tab; label: string }[] = [
    { id: "discover", label: "Discover" },
    { id: "followers", label: `Followers (${followers.length})` },
    { id: "following", label: `Following (${following.length})` },
  ];

  const list =
    tab === "discover"
      ? initialMembers
      : tab === "followers"
        ? followers
        : following;

  return (
    <div>
      <div
        role="tablist"
        aria-label="People views"
        className="grid grid-cols-3 gap-1 rounded-card border border-line bg-soft p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-chip px-2 py-2.5 text-xs font-bold transition sm:px-4 sm:text-sm ${
              tab === t.id
                ? "bg-white text-blue-deep shadow-sm"
                : "text-charcoal-soft hover:bg-white/70 hover:text-charcoal"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-5">
        {list.length === 0 && (
          <p className="text-sm text-charcoal-soft">
            {tab === "discover"
              ? "No visible members are available to discover yet. Use the global search above when you know who you are looking for."
              : tab === "followers"
                ? "No followers yet. As you take part in the community, people will find you."
                : "You aren't following anyone yet. Discover members to build your feed."}
          </p>
        )}
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((m) => (
            <MemberRow key={m.user_id} member={m} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MemberRow({ member }: { member: CommunityMemberCard }) {
  return (
    <li className="card flex min-h-[8.5rem] flex-col items-stretch p-4">
      <div className="flex items-start gap-3">
      <Link
        href={`/app/community/member/${member.user_id}`}
        aria-label={`View ${member.display_name}'s profile`}
      >
        <MemberAvatar
          name={member.display_name}
          avatarUrl={member.avatar_url}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1">
          <Link
            href={`/app/community/member/${member.user_id}`}
            className="truncate font-semibold text-charcoal hover:underline"
          >
            {member.display_name}
          </Link>
          {(member.verification_badges?.length ||
            member.official_organisation) && (
            <VerificationBadges
              badges={member.verification_badges}
              organisationType={member.organisation_type}
              officialOrganisation={member.official_organisation}
            />
          )}
        </span>
        {(member.headline || member.institution) && (
          <p className="truncate text-xs text-charcoal-soft">
            {member.headline || member.institution}
          </p>
        )}
      </div>
      </div>
      {member.bio && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-charcoal-soft">
          {member.bio}
        </p>
      )}
      <div className="mt-auto pt-3 [&>button]:w-full">
        <FollowButton
          userId={member.user_id}
          initiallyFollowing={member.followed_by_me}
        />
      </div>
    </li>
  );
}

export function FollowButton({
  userId,
  initiallyFollowing,
  subtleWhenFollowing = false,
}: {
  userId: string;
  initiallyFollowing: boolean;
  subtleWhenFollowing?: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const result = await toggleFollow(userId, next);
      if ("error" in result) setFollowing(!next); // roll back
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={
        following
          ? subtleWhenFollowing
            ? "shrink-0 rounded-chip px-4 py-2 text-sm font-semibold text-charcoal-soft transition hover:bg-soft hover:text-charcoal"
            : "btn-secondary shrink-0 !px-4 !py-2 text-sm"
          : "btn-primary shrink-0 !px-4 !py-2 text-sm"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
